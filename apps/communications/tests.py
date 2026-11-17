from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.campuses.models import Campus
from apps.communications.models import CommunicationCampaign, MessageLog, MessageTemplate
from apps.members.models import Member
from apps.users.models import User


class P1CommunicationsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.campus_a = Campus.objects.create(name="Mpita", code="HSC-MPITA", campus_type="HQ")
        self.campus_b = Campus.objects.create(
            name="Mpaka", code="HSC-MPAKA", campus_type="EXTENSION", parent=self.campus_a
        )
        self.sa_a = User.objects.create_user(
            username="sa_comm_a",
            password="Password123!",
            role="SUPER_ADMIN",
            campus=self.campus_a,
            phone="+242066000010",
        )
        self.sa_b = User.objects.create_user(
            username="sa_comm_b",
            password="Password123!",
            role="SUPER_ADMIN",
            campus=self.campus_b,
            phone="+242066000020",
        )
        self.welcome_tpl = MessageTemplate.objects.create(
            campus=None,
            name="Bienvenue Auto",
            category="BIENVENUE",
            channel="WHATSAPP",
            body="Bienvenue {first_name} à {campus_name} !",
            is_active=True,
            is_auto_welcome=True,
        )

    def test_auto_welcome_triggered_for_new_member_respecting_opt_in(self):
        self.client.force_authenticate(user=self.sa_a)
        res = self.client.post(
            "/api/v1/members/list/",
            {
                "first_name": "Sarah",
                "last_name": "Mabiala",
                "phone": "+242066123456",
                "campus": self.campus_a.id,
                "status": "NOUVEAU",
                "whatsapp_opt_in": True,
                "sms_opt_in": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        logs = MessageLog.objects.filter(recipient_phone="+242066123456")
        self.assertEqual(logs.count(), 1)
        log = logs.first()
        self.assertEqual(log.channel, "WHATSAPP")
        self.assertEqual(log.status, "SIMULATED")
        self.assertIn("Bienvenue Sarah à Mpita", log.rendered_content)

        # Opt-out member should NOT receive welcome message
        res_optout = self.client.post(
            "/api/v1/members/list/",
            {
                "first_name": "Marc",
                "last_name": "Optout",
                "phone": "+242066999000",
                "campus": self.campus_a.id,
                "status": "NOUVEAU",
                "whatsapp_opt_in": False,
                "sms_opt_in": False,
            },
            format="json",
        )
        self.assertEqual(res_optout.status_code, status.HTTP_201_CREATED)
        self.assertFalse(MessageLog.objects.filter(recipient_phone="+242066999000").exists())

    def test_targeted_campaign_inactive_members_and_tenant_isolation(self):
        Member.objects.create(
            campus=self.campus_a,
            first_name="InactifA",
            last_name="Test",
            phone="+242066111001",
            status="INACTIF",
            sms_opt_in=True,
        )
        Member.objects.create(
            campus=self.campus_a,
            first_name="ActifA",
            last_name="Test",
            phone="+242066111002",
            status="ACTIF",
            sms_opt_in=True,
        )
        Member.objects.create(
            campus=self.campus_b,
            first_name="InactifB",
            last_name="Test",
            phone="+242066222001",
            status="INACTIF",
            sms_opt_in=True,
        )

        self.client.force_authenticate(user=self.sa_a)
        res = self.client.post(
            "/api/v1/communications/campaigns/",
            {
                "title": "Relance Inactifs Mpita",
                "channel": "SMS",
                "audience_type": "INACTIVE_MEMBERS",
                "custom_body": "Bonjour {first_name}, revenez nous voir à {campus_name}.",
                "send_now": True,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["total_recipients"], 1)
        self.assertEqual(res.data["sent_count"], 1)

        campaign = CommunicationCampaign.objects.get(pk=res.data["id"])
        phones = list(campaign.logs.values_list("recipient_phone", flat=True))
        self.assertEqual(phones, ["+242066111001"])
