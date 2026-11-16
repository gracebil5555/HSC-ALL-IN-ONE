from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from apps.users.permissions import (
    IsSuperSuperAdmin,
    IsSuperAdminOfCampus,
    IsAdminDeptOfCampus,
    RoleFilterMixin,
    _effective_role,
    _effective_campus_id,
)
from .models import Department, DepartmentCatalog
from .serializers import DepartmentSerializer, DepartmentCatalogSerializer


def _sync_department_leaders(dept):
    """Synchronise automatiquement les rôles techniques de l'Admin et de l'Adjoint du département."""
    if dept.admin:
        admin_user = dept.admin
        changed = False
        if admin_user.role in ("MEMBRE", "ADJOINT"):
            admin_user.role = "ADMIN_DEPT"
            admin_user.is_deputy = False
            changed = True
        if not admin_user.campus_id and dept.campus_id:
            admin_user.campus_id = dept.campus_id
            changed = True
        if changed:
            admin_user.save()

    if dept.deputy:
        deputy_user = dept.deputy
        deputy_user.is_deputy = True
        if dept.admin_id:
            deputy_user.deputy_of_id = dept.admin_id
        if deputy_user.role == "MEMBRE":
            deputy_user.role = "ADJOINT"
        if not deputy_user.delegated_permissions:
            deputy_user.delegated_permissions = ["voir", "creer"]
        if not deputy_user.campus_id and dept.campus_id:
            deputy_user.campus_id = dept.campus_id
        deputy_user.save()


class DepartmentCatalogViewSet(viewsets.ModelViewSet):
    """
    Gestion du catalogue global des structures HSC (Section 5 & 8).
    - Lecture accessible aux Églises pour activation.
    - Écriture réservée exclusivement au Super Super Admin.
    """
    queryset = DepartmentCatalog.objects.all()
    serializer_class = DepartmentCatalogSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        return [AllowAny()]


class DepartmentViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des départements activés ou créés librement par une Église (Sections 6, 8, 11).
    - Création / activation / désactivation : Super Admin de l'Église (ou Super Super Admin).
    - Désignation d'un adjoint de département : Super Admin ou Admin titulaire de ce département.
    - Isolation stricte par campus.
    """
    queryset = Department.objects.all().select_related("campus", "admin", "deputy", "catalog_item")
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperAdminOfCampus()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), IsAdminDeptOfCampus()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if not campus_id:
                raise PermissionDenied("Aucun campus rattaché à votre compte.")
            dept = serializer.save(campus_id=campus_id)
        else:
            dept = serializer.save()
        _sync_department_leaders(dept)

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        eff_role = _effective_role(user)

        if eff_role == "ADMIN_DEPT" and instance.admin_id != user.id:
            raise PermissionDenied("Vous ne pouvez modifier que le département dont vous êtes le responsable.")

        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if str(instance.campus_id) != str(campus_id):
                raise PermissionDenied("Ce département n'appartient pas à votre Église.")
            dept = serializer.save(campus_id=campus_id)
        else:
            dept = serializer.save()
        _sync_department_leaders(dept)



