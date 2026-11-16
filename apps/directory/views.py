from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import RoleFilterMixin
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer

class BusinessProfileViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = BusinessProfile.objects.all().order_by('-created_at')
    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated]

