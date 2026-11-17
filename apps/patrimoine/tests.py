from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.campuses.models import Campus
from apps.departments.models import Department
from apps.patrimoine.models import Asset, AssetMovement
from apps.users.models import User


class P1PatrimoineDepreciationAndMovementsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.campus_a = Campus.objects.create(name="Mpita", code="HSC-MPITA", campus_type="HQ")
        self.campus_b = Campus.objects.create(
            name="Mpaka", code="HSC-MPAKA", campus_type="EXTENSION", parent=self.campus_a
        )
        self.admin_pat_a = User.objects.create_user(
            username="pat_a", password="Password123!", role="ADMIN_DEPT", campus=self.campus_a
        )
        self.admin_pat_b = User.objects.create_user(
            username="pat_b", password="Password123!", role="ADMIN_DEPT", campus=self.campus_b
        )
        Department.objects.create(
            campus=self.campus_a, name="Patrimoine", code="PATRIMOINE", admin=self.admin_pat_a
        )
        Department.objects.create(
            campus=self.campus_b, name="Patrimoine", code="PATRIMOINE", admin=self.admin_pat_b
        )

    def test_automatic_depreciation_rate_and_prorata_temporis_capped(self):
        # 5 years useful life -> auto rate 20.00%, bought 365 days ago -> 20% depreciated
        asset_1yr = Asset.objects.create(
            campus=self.campus_a,
            name="Console Yamaha",
            purchase_price=Decimal("1000000.00"),
            purchase_date=date.today() - timedelta(days=365),
            useful_life_years=5,
        )
        self.assertEqual(asset_1yr.depreciation_rate, Decimal("20.00"))
        self.assertEqual(asset_1yr.accumulated_depreciation, Decimal("200000.00"))
        self.assertEqual(asset_1yr.net_book_value, Decimal("800000.00"))

        # Bought 10 years ago with 5 years life -> capped at purchase_price, VNC = 0
        asset_old = Asset.objects.create(
            campus=self.campus_a,
            name="Ancien Groupe Électrogène",
            purchase_price=Decimal("500000.00"),
            purchase_date=date.today() - timedelta(days=3650),
            useful_life_years=5,
        )
        self.assertEqual(asset_old.accumulated_depreciation, Decimal("500000.00"))
        self.assertEqual(asset_old.net_book_value, Decimal("0.00"))

    def test_asset_movement_updates_asset_and_enforces_tenant_isolation(self):
        asset_a = Asset.objects.create(
            campus=self.campus_a,
            name="Vidéoprojecteur",
            location="Sanctuaire",
            condition="GOOD",
            purchase_price=Decimal("400000.00"),
        )
        self.client.force_authenticate(user=self.admin_pat_a)
        res = self.client.post(
            "/api/v1/patrimoine/asset-movements/",
            {
                "asset": asset_a.id,
                "movement_type": "TRANSFER",
                "from_location": "Sanctuaire",
                "to_location": "Salle Annexe",
                "observed_condition": "MAINTENANCE",
                "notes": "Révision lampe",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        asset_a.refresh_from_db()
        self.assertEqual(asset_a.location, "Salle Annexe")
        self.assertEqual(asset_a.condition, "MAINTENANCE")
        self.assertEqual(AssetMovement.objects.filter(asset=asset_a).count(), 1)

        # Cross-campus Patrimoine admin cannot create movement on campus A's asset
        self.client.force_authenticate(user=self.admin_pat_b)
        res_cross = self.client.post(
            "/api/v1/patrimoine/asset-movements/",
            {
                "asset": asset_a.id,
                "movement_type": "INSPECTION",
                "observed_condition": "GOOD",
            },
            format="json",
        )
        self.assertEqual(res_cross.status_code, status.HTTP_403_FORBIDDEN)
