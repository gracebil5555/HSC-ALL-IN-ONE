from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.users.permissions import IsSuperSuperAdmin, IsSuperAdminOfCampus, _effective_role
from .models import Campus
from .serializers import CampusSerializer

class CampusViewSet(viewsets.ModelViewSet):
    """
    Gestion des Églises et Extensions HSC (Sections 5, 6, 10, 14, 15).
    - Lecture ouverte (AllowAny) pour alimenter le sélecteur d'églises et l'accueil.
    - Création / suppression d'une nouvelle extension : strictement réservée au Super Super Admin.
    - Modification : Super Super Admin ou Super Admin du campus concerné (hors parent/campus_type/lead_pastor).
    """
    queryset = Campus.objects.all().select_related("parent", "lead_pastor")
    serializer_class = CampusSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), IsSuperAdminOfCampus()]
        return [AllowAny()]

    def perform_create(self, serializer):
        campus = serializer.save()
        if campus.lead_pastor and campus.lead_pastor.role != "SUPER_SUPER_ADMIN":
            pastor = campus.lead_pastor
            pastor.campus = campus
            if pastor.role != "SUPER_ADMIN":
                pastor.role = "SUPER_ADMIN"
            pastor.save()

    def perform_update(self, serializer):
        old_lead_pastor_id = serializer.instance.lead_pastor_id
        campus = serializer.save()
        if (
            _effective_role(self.request.user) == "SUPER_SUPER_ADMIN"
            and campus.lead_pastor
            and campus.lead_pastor_id != old_lead_pastor_id
            and campus.lead_pastor.role != "SUPER_SUPER_ADMIN"
        ):
            pastor = campus.lead_pastor
            pastor.campus = campus
            if pastor.role != "SUPER_ADMIN":
                pastor.role = "SUPER_ADMIN"
            pastor.save()


