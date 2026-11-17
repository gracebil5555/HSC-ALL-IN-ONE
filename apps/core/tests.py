from datetime import date
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.campuses.models import Campus
from apps.core.models import SystemAuditLog, log_audit_event
from apps.departments.models import Department
from apps.finances.models import (
    AccountingPeriodClose,
    ExchangeRate,
    Register,
    Transaction,
    Voucher,
)
from apps.members.models import Member, MemberTransferRequest
from apps.assimilation.models import AssimilationProfile
from apps.patrimoine.models import Asset
from apps.users.models import RoleAssignment, User


class P2StrategicFeaturesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hq_campus = Campus.objects.create(
            name="HSC Mpita (Siège)",
            code="MPITA",
            campus_type="HQ",
            country="Congo",
            city="Pointe-Noire",
            currency="XAF",
        )
        self.canada_campus = Campus.objects.create(
            name="HSC Montréal",
            code="MTL",
            campus_type="EXTENSION",
            parent=self.hq_campus,
            country="Canada",
            city="Montréal",
            currency="CAD",
        )
        self.ssa = User.objects.create_user(
            username="ssa_p2",
            password="Password123!",
            first_name="Apôtre",
            last_name="Général",
            role="SUPER_SUPER_ADMIN",
        )
        self.sa_mtl = User.objects.create_user(
            username="sa_mtl",
            password="Password123!",
            first_name="Pasteur",
            last_name="Montréal",
            role="SUPER_ADMIN",
            campus=self.canada_campus,
        )
        self.sa_mpita = User.objects.create_user(
            username="sa_mpita",
            password="Password123!",
            first_name="Pasteur",
            last_name="Mpita",
            role="SUPER_ADMIN",
            campus=self.hq_campus,
        )

    def test_multicurrency_conversion_and_asset_hq_value(self):
        ExchangeRate.objects.create(
            from_currency="CAD",
            to_currency="XAF",
            rate=Decimal("450.000000"),
            effective_date=date.today(),
            created_by=self.ssa,
        )
        reg = Register.objects.create(
            campus=self.canada_campus,
            name="Caisse CAD",
            register_type="CASH",
            current_balance=Decimal("0.00"),
        )
        tx = Transaction.objects.create(
            campus=self.canada_campus,
            register=reg,
            entry_type="CREDIT",
            category="Dîmes",
            amount=Decimal("100.00"),
            currency="CAD",
            description="Offrande culte",
            registered_by=self.sa_mtl,
        )
        self.assertEqual(tx.exchange_rate_to_hq, Decimal("450.000000"))
        self.assertEqual(tx.amount_in_hq_currency, Decimal("45000.00"))

        asset = Asset.objects.create(
            campus=self.canada_campus,
            name="Console Sonore",
            purchase_price=Decimal("2000.00"),
            currency="CAD",
        )
        self.assertEqual(asset.amount_in_hq_currency, Decimal("900000.00"))

    def test_voucher_double_validation_above_threshold(self):
        reg = Register.objects.create(
            campus=self.hq_campus,
            name="Caisse Centrale",
            register_type="CASH",
            current_balance=Decimal("2000000.00"),
        )
        voucher = Voucher.objects.create(
            campus=self.hq_campus,
            title="Achat Générateur",
            description="Groupe électrogène",
            amount=Decimal("750000.00"),
            currency="XAF",
            register=reg,
            requester=self.sa_mpita,
        )
        self.assertTrue(voucher.requires_double_validation)

        self.client.force_authenticate(user=self.sa_mpita)
        res1 = self.client.post(f"/api/v1/finances/vouchers/{voucher.id}/approve/", {"note": "OK 1"})
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.data["status"], "PENDING_SECOND_APPROVAL")

        # Même approbateur refusé pour la 2e validation
        res_same = self.client.post(f"/api/v1/finances/vouchers/{voucher.id}/approve/", {"note": "Same"})
        self.assertEqual(res_same.status_code, 403)

        # Second approbateur distinct
        self.client.force_authenticate(user=self.ssa)
        res2 = self.client.post(f"/api/v1/finances/vouchers/{voucher.id}/approve/", {"note": "OK 2"})
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.data["status"], "APPROVED")

    def test_accounting_period_close_blocks_new_transactions(self):
        today = date.today()
        AccountingPeriodClose.objects.create(
            campus=self.hq_campus,
            year=today.year,
            month=today.month,
            is_closed=True,
            closed_by=self.sa_mpita,
        )
        reg = Register.objects.create(
            campus=self.hq_campus,
            name="Caisse Principale",
            register_type="CASH",
            current_balance=Decimal("100000.00"),
        )
        self.client.force_authenticate(user=self.sa_mpita)
        res = self.client.post(
            "/api/v1/finances/transactions/",
            {
                "register": reg.id,
                "entry_type": "CREDIT",
                "category": "Offrandes",
                "amount": "5000.00",
                "description": "Test période clôturée",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_system_audit_log_is_append_only(self):
        log = log_audit_event(
            actor=self.ssa,
            action="TEST_ACTION",
            target_model="Campus",
            target_id=self.hq_campus.id,
            campus=self.hq_campus,
            description="Initial log",
        )
        log.description = "Tampered"
        with self.assertRaises(ValidationError):
            log.save()
        with self.assertRaises(ValidationError):
            log.delete()

    def test_role_assignment_history(self):
        assignment = RoleAssignment.objects.create(
            user=self.sa_mtl,
            campus=self.canada_campus,
            role="SUPER_ADMIN",
            ecclesial_function="PASTEUR",
            appointed_by=self.ssa,
            start_date=date.today(),
            is_active=True,
        )
        self.client.force_authenticate(user=self.ssa)
        res = self.client.get(f"/api/v1/users/{self.sa_mtl.id}/role-history/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], assignment.id)

    def test_member_transfer_preserves_assimilation_and_logs_audit(self):
        member = Member.objects.create(
            campus=self.hq_campus,
            first_name="Jean",
            last_name="Mbemba",
            phone="+242060000000",
            status="ACTIF",
        )
        profile = AssimilationProfile.objects.create(
            campus=self.hq_campus,
            member=member,
            current_stage="M2",
        )
        self.client.force_authenticate(user=self.sa_mpita)
        create_res = self.client.post(
            "/api/v1/members/transfers/",
            {
                "member": member.id,
                "to_campus": self.canada_campus.id,
                "reason": "Déménagement professionnel",
                "preserve_assimilation": True,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, 201)
        transfer_id = create_res.data["id"]

        self.client.force_authenticate(user=self.ssa)
        approve_res = self.client.post(f"/api/v1/members/transfers/{transfer_id}/approve/", {}, format="json")
        self.assertEqual(approve_res.status_code, 200)
        self.assertEqual(approve_res.data["status"], "APPROVED")

        member.refresh_from_db()
        profile.refresh_from_db()
        self.assertEqual(member.campus_id, self.canada_campus.id)
        self.assertEqual(profile.campus_id, self.canada_campus.id)
        self.assertEqual(profile.current_stage, "M2")
        self.assertTrue(
            SystemAuditLog.objects.filter(action="MEMBER_TRANSFER_APPROVED", target_id=str(transfer_id)).exists()
        )

    def test_pagination_and_throttling_configured(self):
        self.assertEqual(
            settings.REST_FRAMEWORK.get("DEFAULT_PAGINATION_CLASS"),
            "apps.core.pagination.StandardResultsSetPagination",
        )
        self.assertIn("login", settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}))
        self.assertIn("communications", settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}))

    def test_audit_log_api_rbac_and_filters(self):
        log_audit_event(
            actor=self.ssa,
            action="EXCHANGE_RATE_CREATED",
            target_model="ExchangeRate",
            target_id=1,
            campus=self.hq_campus,
            description="Taux CAD->XAF",
        )
        log_audit_event(
            actor=self.sa_mtl,
            action="FINANCE_PERIOD_CLOSED",
            target_model="AccountingPeriodClose",
            target_id=2,
            campus=self.canada_campus,
            description="Clôture Montréal",
        )

        admin_fin = User.objects.create_user(
            username="fin_audit", password="Password123!", role="ADMIN_DEPT", campus=self.hq_campus
        )
        self.client.force_authenticate(user=admin_fin)
        self.assertEqual(self.client.get("/api/v1/core/audit-logs/").status_code, 403)

        self.client.force_authenticate(user=self.sa_mtl)
        res_sa = self.client.get("/api/v1/core/audit-logs/")
        self.assertEqual(res_sa.status_code, 200)
        self.assertEqual(len(res_sa.data["results"]), 1)
        self.assertEqual(res_sa.data["results"][0]["target_model"], "AccountingPeriodClose")

        self.client.force_authenticate(user=self.ssa)
        res_filter = self.client.get("/api/v1/core/audit-logs/", {"target_model": "ExchangeRate", "search": "CAD"})
        self.assertEqual(res_filter.status_code, 200)
        self.assertEqual(len(res_filter.data["results"]), 1)
        self.assertEqual(res_filter.data["results"][0]["action"], "EXCHANGE_RATE_CREATED")

    def test_period_close_reopen_reclose_and_rbac(self):
        admin_fin = User.objects.create_user(
            username="fin_p2", password="Password123!", role="ADMIN_DEPT", campus=self.hq_campus
        )
        Department.objects.create(campus=self.hq_campus, name="Finances", code="FINANCES", admin=admin_fin)

        admin_acc = User.objects.create_user(
            username="acc_p2", password="Password123!", role="ADMIN_DEPT", campus=self.hq_campus
        )
        Department.objects.create(campus=self.hq_campus, name="Accueil", code="ACCUEIL", admin=admin_acc)

        # ADMIN_DEPT Accueil cannot access period-closes
        self.client.force_authenticate(user=admin_acc)
        self.assertEqual(self.client.get("/api/v1/finances/period-closes/").status_code, 403)

        # ADMIN_DEPT Finances can list (200) but cannot close (403)
        self.client.force_authenticate(user=admin_fin)
        self.assertEqual(self.client.get("/api/v1/finances/period-closes/").status_code, 200)
        self.assertEqual(
            self.client.post("/api/v1/finances/period-closes/", {"year": 2026, "month": 10}, format="json").status_code,
            403,
        )

        # SUPER_ADMIN can close without passing campus in body
        self.client.force_authenticate(user=self.sa_mpita)
        res_close = self.client.post(
            "/api/v1/finances/period-closes/",
            {"year": 2026, "month": 10, "notes": "Clôture initiale"},
            format="json",
        )
        self.assertEqual(res_close.status_code, 201)
        period_id = res_close.data["id"]
        self.assertTrue(res_close.data["is_closed"])

        # SUPER_SUPER_ADMIN can reopen
        self.client.force_authenticate(user=self.ssa)
        res_reopen = self.client.post(f"/api/v1/finances/period-closes/{period_id}/reopen/", {}, format="json")
        self.assertEqual(res_reopen.status_code, 200)
        self.assertFalse(res_reopen.data["is_closed"])

        # Re-closing the same reopened period succeeds (no UniqueTogetherValidator 400)
        self.client.force_authenticate(user=self.sa_mpita)
        res_reclose = self.client.post(
            "/api/v1/finances/period-closes/",
            {"year": 2026, "month": 10, "notes": "Re-clôture"},
            format="json",
        )
        self.assertEqual(res_reclose.status_code, 201)
        self.assertTrue(res_reclose.data["is_closed"])

    def test_exchange_rate_rbac(self):
        self.client.force_authenticate(user=self.sa_mpita)
        self.assertEqual(self.client.get("/api/v1/finances/exchange-rates/").status_code, 200)
        self.assertEqual(
            self.client.post(
                "/api/v1/finances/exchange-rates/",
                {"from_currency": "EUR", "to_currency": "XAF", "rate": "655.957000", "effective_date": "2026-11-01"},
                format="json",
            ).status_code,
            403,
        )

        self.client.force_authenticate(user=self.ssa)
        res_create = self.client.post(
            "/api/v1/finances/exchange-rates/",
            {"from_currency": "EUR", "to_currency": "XAF", "rate": "655.957000", "effective_date": "2026-11-01"},
            format="json",
        )
        self.assertEqual(res_create.status_code, 201)
