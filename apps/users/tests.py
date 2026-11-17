from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.assimilation.models import AssimilationProfile
from apps.campuses.models import Campus
from apps.departments.models import Department
from apps.finances.models import Register
from apps.members.models import Member
from apps.patrimoine.models import ConsumableItem
from apps.users.models import User
from apps.users.permissions import _effective_role
from apps.users.serializers import UserSerializer


class P0SecurityAndContractTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.campus_a = Campus.objects.create(
            name="Mpita", code="HSC-MPITA", campus_type="HQ"
        )
        self.campus_b = Campus.objects.create(
            name="Mpaka", code="HSC-MPAKA", campus_type="EXTENSION", parent=self.campus_a
        )

        self.ssa = User.objects.create_user(
            username="ssa", password="Password123!", role="SUPER_SUPER_ADMIN", campus=None
        )
        self.sa_a = User.objects.create_user(
            username="sa_a", password="Password123!", role="SUPER_ADMIN", campus=self.campus_a
        )
        self.sa_b = User.objects.create_user(
            username="sa_b", password="Password123!", role="SUPER_ADMIN", campus=self.campus_b
        )
        self.admin_fin_a = User.objects.create_user(
            username="fin_a", password="Password123!", role="ADMIN_DEPT", campus=self.campus_a
        )
        self.admin_chorale_a = User.objects.create_user(
            username="chorale_a", password="Password123!", role="ADMIN_DEPT", campus=self.campus_a
        )
        self.member_a = User.objects.create_user(
            username="member_a", password="Password123!", role="MEMBRE", campus=self.campus_a
        )
        self.member_b = User.objects.create_user(
            username="member_b", password="Password123!", role="MEMBRE", campus=self.campus_b
        )

        self.dept_fin_a = Department.objects.create(
            campus=self.campus_a, name="Finances", code="FINANCES", admin=self.admin_fin_a
        )
        self.dept_chorale_a = Department.objects.create(
            campus=self.campus_a, name="Chorale", code="CHORALE", admin=self.admin_chorale_a
        )
        self.dept_accueil_a = Department.objects.create(
            campus=self.campus_a, name="Accueil", code="ACCUEIL"
        )

    def test_campus_requires_auth_and_restricts_hierarchy_fields(self):
        res = self.client.get("/api/v1/campuses/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.sa_a)
        res = self.client.patch(
            f"/api/v1/campuses/{self.campus_a.id}/",
            {"campus_type": "EXTENSION"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        res = self.client.patch(
            f"/api/v1/campuses/{self.campus_a.id}/",
            {"lead_pastor": self.member_b.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_campus_cycle_validation(self):
        self.campus_a.parent = self.campus_a
        with self.assertRaises(ValidationError):
            self.campus_a.clean()

        self.campus_a.parent = self.campus_b
        with self.assertRaises(ValidationError):
            self.campus_a.clean()

    def test_effective_role_checks_deputy_before_own_role(self):
        self.admin_chorale_a.is_deputy = True
        self.admin_chorale_a.deputy_of = self.sa_a
        self.admin_chorale_a.save()
        self.assertEqual(_effective_role(self.admin_chorale_a), "SUPER_ADMIN")

    def test_assign_deputy_rank_campus_replacement_and_ssa_global(self):
        # Cannot assign equal/higher rank
        self.client.force_authenticate(user=self.sa_a)
        res = self.client.post(
            f"/api/v1/users/{self.sa_a.id}/assign-deputy/",
            {"deputy_id": self.sa_b.id, "delegated_permissions": ["voir"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Assign member_a as deputy of sa_a, then replace with admin_chorale_a
        res = self.client.post(
            f"/api/v1/users/{self.sa_a.id}/assign-deputy/",
            {"deputy_id": self.member_a.id, "delegated_permissions": ["voir"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.post(
            f"/api/v1/users/{self.sa_a.id}/assign-deputy/",
            {"deputy_id": self.admin_chorale_a.id, "delegated_permissions": ["voir", "valider"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member_a.refresh_from_db()
        self.assertFalse(self.member_a.is_deputy)
        self.assertIsNone(self.member_a.deputy_of)

        # Deputy cannot call assign_deputy even with administrer
        self.admin_chorale_a.delegated_permissions = ["administrer"]
        self.admin_chorale_a.save()
        self.client.force_authenticate(user=self.admin_chorale_a)
        res = self.client.post(
            f"/api/v1/users/{self.sa_a.id}/assign-deputy/",
            {"deputy_id": self.member_a.id, "delegated_permissions": ["voir"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # SSA assigns global deputy -> campus forced to None
        self.client.force_authenticate(user=self.ssa)
        res = self.client.post(
            f"/api/v1/users/{self.ssa.id}/assign-deputy/",
            {"deputy_id": self.member_a.id, "delegated_permissions": ["voir"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member_a.refresh_from_db()
        self.assertIsNone(self.member_a.campus_id)
        self.assertIsNone(UserSerializer(self.member_a).data["campus_id"])

    def test_user_serializer_readonly_deputy_fields_and_assign_department(self):
        serializer = UserSerializer(
            data={
                "username": "new_mem",
                "role": "MEMBRE",
                "campus": self.campus_a.id,
                "department_id": self.dept_accueil_a.id,
                "is_deputy": True,
                "deputy_of": self.sa_a.id,
                "delegated_permissions": ["administrer"],
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertFalse(user.is_deputy)
        self.assertIsNone(user.deputy_of)
        self.assertEqual(user.delegated_permissions, [])
        self.dept_accueil_a.refresh_from_db()
        self.assertIsNone(self.dept_accueil_a.admin)

    def test_department_isolation_and_stock_campus_check(self):
        m_chorale = Member.objects.create(
            campus=self.campus_a, first_name="Paul", last_name="Chant", department=self.dept_chorale_a
        )
        m_accueil = Member.objects.create(
            campus=self.campus_a, first_name="Jean", last_name="Accueil", department=self.dept_accueil_a
        )

        # Finances admin cannot access members
        self.client.force_authenticate(user=self.admin_fin_a)
        res = self.client.get("/api/v1/members/list/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Chorale admin only sees Chorale members
        self.client.force_authenticate(user=self.admin_chorale_a)
        res = self.client.get("/api/v1/members/list/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data["results"] if isinstance(res.data, dict) and "results" in res.data else res.data
        ids = [m["id"] for m in results]
        self.assertIn(m_chorale.id, ids)
        self.assertNotIn(m_accueil.id, ids)

        # Cross-campus stock movement forbidden
        admin_pat_a = User.objects.create_user(
            username="pat_a", password="Password123!", role="ADMIN_DEPT", campus=self.campus_a
        )
        Department.objects.create(campus=self.campus_a, name="Patrimoine", code="PATRIMOINE", admin=admin_pat_a)
        item_b = ConsumableItem.objects.create(campus=self.campus_b, name="Enveloppes", quantity_in_stock=50)

        self.client.force_authenticate(user=admin_pat_a)
        res = self.client.post(
            "/api/v1/patrimoine/movements/",
            {"item": item_b.id, "movement_type": "OUT", "quantity": 5, "reason": "Test"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # SUPER_SUPER_ADMIN can create StockMovement without passing campus
        self.client.force_authenticate(user=self.ssa)
        res = self.client.post(
            "/api/v1/patrimoine/movements/",
            {"item": item_b.id, "movement_type": "IN", "quantity": 10, "reason": "Réappro"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        item_b.refresh_from_db()
        self.assertEqual(item_b.quantity_in_stock, 60)

    def test_department_self_deputy_and_permissions_validation(self):
        self.client.force_authenticate(user=self.sa_a)
        # Admin cannot be set as their own deputy
        res = self.client.patch(
            f"/api/v1/departments/{self.dept_chorale_a.id}/",
            {"deputy": self.admin_chorale_a.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Assign member_a as deputy with custom permissions
        res = self.client.patch(
            f"/api/v1/departments/{self.dept_chorale_a.id}/",
            {"deputy": self.member_a.id, "deputy_permissions": ["voir", "exporter"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.member_a.refresh_from_db()
        self.assertEqual(self.member_a.delegated_permissions, ["voir", "exporter"])

    def test_assimilation_stage_and_voucher_contracts(self):
        m = Member.objects.create(
            campus=self.campus_a, first_name="Luc", last_name="Test", department=self.dept_accueil_a
        )
        self.client.force_authenticate(user=self.sa_a)
        res = self.client.patch(
            f"/api/v1/members/list/{m.id}/assimilation-stage/",
            {"stage": "MODULE_1"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["assimilation_stage"], "MODULE_1")
        profile = AssimilationProfile.objects.get(member=m)
        self.assertEqual(profile.campus_id, self.campus_a.id)

        Register.objects.create(campus=self.campus_a, name="Caisse A", register_type="CASH")
        res = self.client.post(
            "/api/v1/finances/vouchers/",
            {"title": "Fournisseur", "description": "Achat micro", "amount": "25000.00"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("voucher_number", res.data)
        self.assertEqual(res.data["beneficiary"], "Fournisseur")
