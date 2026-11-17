from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import (
    RoleFilterMixin,
    IsAdminDeptOfCampus,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
)
from .models import MessageTemplate, CommunicationCampaign, MessageLog
from .serializers import (
    MessageTemplateSerializer,
    CommunicationCampaignSerializer,
    MessageLogSerializer,
)
from .services import execute_campaign

ALLOWED_COMMUNICATION_DEPTS = ["ACCUEIL", "SECRETARIAT", "COMMUNICATION"]


class MessageTemplateViewSet(viewsets.ModelViewSet):
    """
    Modèles de messages SMS & WhatsApp réutilisables (Sections 22, 23, 26).
    - SUPER_SUPER_ADMIN : gère les modèles globaux (campus=None) et de tous les campus.
    - SUPER_ADMIN / ADMIN_DEPT (Accueil, Secrétariat, Communication) : voit les modèles globaux + ceux de son campus,
      et ne peut créer/modifier/supprimer que les modèles de son propre campus.
    """
    queryset = MessageTemplate.objects.select_related("campus", "created_by").all()
    serializer_class = MessageTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ALLOWED_COMMUNICATION_DEPTS

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if _effective_role(user) == "SUPER_SUPER_ADMIN":
            campus_id = self.request.query_params.get("campus_id")
            if campus_id and campus_id != "all":
                return qs.filter(Q(campus_id=campus_id) | Q(campus__isnull=True))
            return qs

        campus_id = _effective_campus_id(user)
        if not campus_id:
            return qs.none()
        return qs.filter(Q(campus_id=campus_id) | Q(campus__isnull=True))

    def perform_create(self, serializer):
        user = self.request.user
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if not campus_id:
                raise PermissionDenied("Aucun campus rattaché à votre compte.")
            serializer.save(campus_id=campus_id, created_by=user)
            return
        serializer.save(created_by=user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if instance.campus_id is None or str(instance.campus_id) != str(campus_id):
                raise PermissionDenied("Vous ne pouvez modifier que les modèles propres à votre campus.")
            serializer.save(campus_id=campus_id)
            return
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if instance.campus_id is None or str(instance.campus_id) != str(campus_id):
                raise PermissionDenied("Vous ne pouvez supprimer que les modèles propres à votre campus.")
        instance.delete()


class CommunicationCampaignViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Campagnes d'envoi ciblé SMS & WhatsApp (Sections 22, 23, 26).
    """
    queryset = CommunicationCampaign.objects.select_related(
        "campus", "template", "target_department", "created_by"
    ).all()
    serializer_class = CommunicationCampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ALLOWED_COMMUNICATION_DEPTS
    throttle_scope = "communications"

    def perform_create(self, serializer):
        from apps.campuses.models import Campus

        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if not campus_id:
                raise PermissionDenied("Aucun campus rattaché à votre compte.")
            campaign = serializer.save(campus_id=campus_id, created_by=user)
        else:
            campus_obj = serializer.validated_data.get("campus")
            if not campus_obj:
                campus_id = Campus.objects.order_by("id").values_list("id", flat=True).first()
                if not campus_id:
                    raise PermissionDenied("Aucun campus disponible pour cette campagne.")
                campaign = serializer.save(campus_id=campus_id, created_by=user)
            else:
                campaign = serializer.save(created_by=user)

        send_now = self.request.data.get("send_now", True)
        if send_now not in (False, "false", "0", 0):
            execute_campaign(campaign)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        campaign = self.get_object()
        execute_campaign(campaign)
        return Response(self.get_serializer(campaign).data, status=status.HTTP_200_OK)


class MessageLogViewSet(RoleFilterMixin, viewsets.ReadOnlyModelViewSet):
    """
    Historique complet des messages SMS & WhatsApp envoyés / simulés (Sections 22, 23, 26).
    """
    queryset = MessageLog.objects.select_related(
        "campus", "campaign", "template", "recipient_member", "recipient_user"
    ).all()
    serializer_class = MessageLogSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ALLOWED_COMMUNICATION_DEPTS

    def get_queryset(self):
        qs = super().get_queryset()
        channel = self.request.query_params.get("channel")
        if channel and channel != "ALL":
            qs = qs.filter(channel=channel)
        status_param = self.request.query_params.get("status")
        if status_param and status_param != "ALL":
            qs = qs.filter(status=status_param)
        return qs
