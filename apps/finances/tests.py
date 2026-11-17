from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.campuses.models import Campus
from apps.departments.models import Department
from apps.finances.models import Register, Transaction
from apps.users.models import User


class P1FinancesTransactionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.campus_a = Campus.objects.create(name="Mpita", code="HSC-MPITA", campus_type="HQ")
        self.admin_fin = User.objects.create_user(
            username="fin_p1", password="Password123!", role="ADMIN_DEPT", campus=self.campus_a
        )
        Department.objects.create(
            campus=self.campus_a, name="Finances", code="FINANCES", admin=self.admin_fin
        )
        self.register = Register.objects.create(
            campus=self.campus_a, name="Caisse Principale", register_type="CASH", current_balance=Decimal("0.00")
        )

    def test_transaction_updates_register_balance_and_is_immutable(self):
        self.client.force_authenticate(user=self.admin_fin)

        # 1. Credit (Recette)
        res_credit = self.client.post(
            "/api/v1/finances/transactions/",
            {
                "entry_type": "CREDIT",
                "category": "DIMES",
                "amount": "150000.00",
                "description": "Culte Dominical",
            },
            format="json",
        )
        self.assertEqual(res_credit.status_code, status.HTTP_201_CREATED)
        self.register.refresh_from_db()
        self.assertEqual(self.register.current_balance, Decimal("150000.00"))

        # 2. Debit (Dépense directe)
        res_debit = self.client.post(
            "/api/v1/finances/transactions/",
            {
                "entry_type": "DEBIT",
                "category": "SOCIAL",
                "amount": "25000.00",
                "description": "Aide sociale",
            },
            format="json",
        )
        self.assertEqual(res_debit.status_code, status.HTTP_201_CREATED)
        self.register.refresh_from_db()
        self.assertEqual(self.register.current_balance, Decimal("125000.00"))

        # 3. Past transactions cannot be modified or deleted
        tx_id = res_credit.data["id"]
        res_patch = self.client.patch(
            f"/api/v1/finances/transactions/{tx_id}/",
            {"amount": "999999.00"},
            format="json",
        )
        self.assertEqual(res_patch.status_code, status.HTTP_403_FORBIDDEN)

        res_del = self.client.delete(f"/api/v1/finances/transactions/{tx_id}/")
        self.assertEqual(res_del.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Transaction.objects.filter(pk=tx_id).exists())
