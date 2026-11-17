from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import RoleFilterMixin, IsAdminDeptOfCampus, AdjointCanPerformAction
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer

class BusinessProfileViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = BusinessProfile.objects.all().order_by('-created_at')
    serializer_class = BusinessProfileSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdminDeptOfCampus(), AdjointCanPerformAction()]
        return [IsAuthenticated()]

