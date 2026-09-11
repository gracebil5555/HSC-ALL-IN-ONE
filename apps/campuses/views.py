from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Campus
from .serializers import CampusSerializer

class CampusViewSet(viewsets.ModelViewSet):
    queryset = Campus.objects.all()
    serializer_class = CampusSerializer
    permission_classes = [AllowAny]
