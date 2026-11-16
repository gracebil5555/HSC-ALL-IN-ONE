from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import (
    RoleFilterMixin,
    IsAdjointOrAbove,
    AdjointCanPerformAction,
    _effective_role,
    _effective_user,
)
from .models import Brigade, Member, Attendance, PastoralAlert
from .serializers import BrigadeSerializer, MemberSerializer, AttendanceSerializer, PastoralAlertSerializer


class BrigadeViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des Brigades et GDC d'une Église (Sections 6, 11, 16).
    Strictement isolée par campus.
    """
    queryset = Brigade.objects.select_related("campus", "leader").all()
    serializer_class = BrigadeSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]


class MemberViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des membres et du suivi pastoral (Sections 16, 20, 22, 25).
    - Strictement isolée par Église / campus.
    - Pour un Admin de Département (hors Accueil/Secrétariat/Social), filtre optionnellement
      par département ou affiche les membres de son périmètre.
    """
    queryset = Member.objects.select_related("campus", "brigade", "department").all().order_by('-created_at')
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

    def get_queryset(self):
        qs = super().get_queryset()
        department_id = self.request.query_params.get("department_id")
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs


class AttendanceViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("campus", "member", "scanned_by").all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]


class PastoralAlertViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = PastoralAlert.objects.select_related("campus", "member", "assigned_pastor").all().order_by('-created_at')
    serializer_class = PastoralAlertSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

