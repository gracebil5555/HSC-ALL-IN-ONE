from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import AILog
from .serializers import AILogSerializer

class AILogViewSet(viewsets.ModelViewSet):
    queryset = AILog.objects.all().order_by('-created_at')
    serializer_class = AILogSerializer
    permission_classes = [AllowAny]
