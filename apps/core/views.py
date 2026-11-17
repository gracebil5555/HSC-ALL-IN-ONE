from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsSuperAdmin, _effective_role, _effective_campus_id
from .models import SystemAuditLog
from .serializers import SystemAuditLogSerializer


class SystemAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consultation en lecture seule du journal d'audit immuable.
    - SUPER_SUPER_ADMIN : accès mondial (filtrable par campus_id / action / target_model / search).
    - SUPER_ADMIN : accès limité à son campus.
    """
    queryset = SystemAuditLog.objects.select_related('actor', 'campus').all()
    serializer_class = SystemAuditLogSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != 'SUPER_SUPER_ADMIN':
            campus_id = _effective_campus_id(user)
            if not campus_id:
                return qs.none()
            qs = qs.filter(campus_id=campus_id)
        else:
            campus_id = self.request.query_params.get('campus_id')
            if campus_id and campus_id != 'all':
                qs = qs.filter(campus_id=campus_id)

        action_filter = self.request.query_params.get('action')
        if action_filter and action_filter != 'ALL':
            qs = qs.filter(action=action_filter)

        target_model = self.request.query_params.get('target_model')
        if target_model and target_model != 'ALL':
            qs = qs.filter(target_model=target_model)

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(actor_username__icontains=search)
                | Q(action__icontains=search)
                | Q(target_model__icontains=search)
                | Q(target_id__icontains=search)
                | Q(description__icontains=search)
            )
        return qs
