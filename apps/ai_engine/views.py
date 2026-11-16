from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import RoleFilterMixin, IsAdjointOrAbove, AdjointCanPerformAction
from .models import AILog
from .serializers import AILogSerializer

class AILogViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = AILog.objects.all().order_by('-created_at')
    serializer_class = AILogSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

