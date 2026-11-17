from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.campuses.models import Campus
from apps.departments.models import Department
from apps.members.models import (
    EcclesialFunctionCatalog,
    Member,
    MemberStatusCatalog,
)
from apps.users.models import User


class P1ConfigurableCatalogsAndContactsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.campus_a = Campus.objects.create(name="Mpita", code="HSC-MPITA", campus_type="HQ")
        self.campus_b = Campus.objects.create(
            name="Mpaka", code="HSC-MPAKA", campus_type="EXTENSION", parent=self.campus_a
        )
        self.ssa = User.objects.create_user(
            username="ssa_p1", password="Password123!", role="SUPER_SUPER_ADMIN", campus=None
        )
        self.sa_a = User.objects.create_user(
            username="sa_a_p1",
            password="Password123!",
            role="SUPER_ADMIN",
            campus=self.campus_a,
            ecclesial_function="PASTEUR",
            phone="+242066111111",
        )
        self.sa_b = User.objects.create_user(
            username="sa_b_p1",
            password="Password123!",
            role="SUPER_ADMIN",
            campus=self.campus_b,
            ecclesial_function="PASTEUR",
            phone="+242066222222",
        )
        self.dept_chorale_a = Department.objects.create(
            campus=self.campus_a, name="Chorale", code="CHORALE"
        )

    def test_ecclesial_function_and_status_catalog_permissions_and_dynamic_member(self):
        # Super Admin cannot write to catalog
        self.client.force_authenticate(user=self.sa_a)
        res = self.client.post(
            "/api/v1/members/ecclesial-functions/",
            {"code": "PROTOCOLE", "label": "Protocole", "rank_order": 15},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Super Super Admin can create custom ecclesial function and member status
        self.client.force_authenticate(user=self.ssa)
        res_fn = self.client.post(
            "/api/v1/members/ecclesial-functions/",
            {"code": "PROTOCOLE", "label": "Protocole", "rank_order": 15},
            format="json",
        )
        self.assertEqual(res_fn.status_code, status.HTTP_201_CREATED)

        res_st = self.client.post(
            "/api/v1/members/statuses/",
            {"code": "EN_ATTENTE", "label": "En attente", "color": "amber"},
            format="json",
        )
        self.assertEqual(res_st.status_code, status.HTTP_201_CREATED)

        # Authenticated Super Admin can read catalogs
        self.client.force_authenticate(user=self.sa_a)
        self.assertEqual(self.client.get("/api/v1/members/ecclesial-functions/").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/v1/members/statuses/").status_code, status.HTTP_200_OK)

        # Create Member using newly configured catalog codes
        res_member = self.client.post(
            "/api/v1/members/list/",
            {
                "first_name": "Jean",
                "last_name": "Kibamba",
                "phone": "+242066999888",
                "campus": self.campus_a.id,
                "status": "EN_ATTENTE",
                "ecclesial_function": "PROTOCOLE",
            },
            format="json",
        )
        self.assertEqual(res_member.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_member.data["ecclesial_function_display"], "Protocole")
        self.assertEqual(res_member.data["status_display"], "En attente")

    def test_unified_contacts_filters_and_tenant_isolation(self):
        Member.objects.create(
            campus=self.campus_a,
            first_name="Grace",
            last_name="Mavoungou",
            phone="+242066333333",
            status="ACTIF",
            ecclesial_function="DIACRE",
            department=self.dept_chorale_a,
        )
        Member.objects.create(
            campus=self.campus_b,
            first_name="Paul",
            last_name="Ngoma",
            phone="+242066444444",
            status="INACTIF",
            ecclesial_function="DIACRE",
        )

        self.client.force_authenticate(user=self.sa_a)
        res = self.client.get(
            "/api/v1/users/contacts/",
            {"ecclesial_function": "DIACRE", "department_id": self.dept_chorale_a.id},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        phones = [c["phone"] for c in res.data]
        self.assertIn("+242066333333", phones)
        self.assertNotIn("+242066444444", phones)
