from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Department, DepartmentCatalog
from .serializers import DepartmentSerializer, DepartmentCatalogSerializer

class DepartmentCatalogViewSet(viewsets.ModelViewSet):
    """
    Gestion du catalogue global des structures HSC (Super Super Admin).
    Accessible en lecture à toutes les Églises pour activation.
    """
    queryset = DepartmentCatalog.objects.all()
    serializer_class = DepartmentCatalogSerializer
    permission_classes = [AllowAny]


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Gestion des départements activés ou créés par une Église donnée.
    Permet le filtrage par ?campus_id=<id>
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        campus_id = self.request.query_params.get('campus_id')
        if campus_id and campus_id != 'all':
            qs = qs.filter(campus_id=campus_id)
        return qs

