from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.users.permissions import (
    IsSuperSuperAdmin,
    IsSuperAdminOfCampus,
    IsAdminDeptOfCampus,
    RoleFilterMixin,
    _effective_role,
    _effective_campus_id,
    _effective_user,
    _is_deputy_Account,
)
from .models import Department, DepartmentCatalog
from .serializers import DepartmentSerializer, DepartmentCatalogSerializer

ALLOWED_DELEGATED_PERMISSIONS = {
    "voir", "creer", "modifier", "supprimer", "valider", "exporter", "administrer"
}


def _revoke_user_deputy_status(user_obj, exclude_dept_id=None):
    """Révoque proprement le statut d'adjoint d'un utilisateur s'il n'est plus adjoint ailleurs."""
    if not user_obj:
        return
    qs = user_obj.deputy_departments.filter(is_active=True)
    if exclude_dept_id is not None:
        qs = qs.exclude(pk=exclude_dept_id)
    if qs.exists():
        return
    user_obj.is_deputy = False
    user_obj.deputy_of = None
    user_obj.delegated_permissions = []
    if user_obj.role == "ADJOINT":
        user_obj.role = "MEMBRE"
    user_obj.save()


def _sync_department_leaders(dept, deputy_permissions=None):
    """Synchronise automatiquement les rôles techniques de l'Admin et de l'Adjoint du département."""
    if dept.admin:
        admin_user = dept.admin
        changed = False
        if admin_user.role in ("MEMBRE", "ADJOINT"):
            admin_user.role = "ADMIN_DEPT"
            admin_user.is_deputy = False
            admin_user.deputy_of = None
            admin_user.delegated_permissions = []
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
        if isinstance(deputy_permissions, list):
            filtered = [p for p in deputy_permissions if p in ALLOWED_DELEGATED_PERMISSIONS]
            deputy_user.delegated_permissions = filtered or ["voir"]
        elif not deputy_user.delegated_permissions:
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

    def _validate_leaders(self, validated_data, target_campus_id, instance=None):
        deputy = validated_data.get("deputy")
        admin_user = validated_data.get("admin", instance.admin if instance else None)

        if "admin" in validated_data and admin_user and target_campus_id and admin_user.campus_id and str(admin_user.campus_id) != str(target_campus_id):
            raise ValidationError({"admin": "L'administrateur doit appartenir au même campus que le département."})

        if deputy:
            if admin_user and deputy.pk == admin_user.pk:
                raise ValidationError({"deputy": "L'administrateur du département ne peut pas être son propre adjoint."})
            if deputy.role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
                raise ValidationError({"deputy": "Un Super Admin ne peut pas être désigné comme adjoint de département."})
            if target_campus_id and deputy.campus_id and str(deputy.campus_id) != str(target_campus_id):
                raise ValidationError({"deputy": "L'adjoint doit appartenir au même campus que le département."})

    def _get_requested_deputy_permissions(self):
        perms = self.request.data.get("deputy_permissions")
        if perms is None:
            perms = self.request.data.get("delegated_permissions")
        return perms if isinstance(perms, list) else None

    def perform_create(self, serializer):
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if not campus_id:
                raise PermissionDenied("Aucun campus rattaché à votre compte.")
            self._validate_leaders(serializer.validated_data, campus_id)
            dept = serializer.save(campus_id=campus_id)
        else:
            campus_obj = serializer.validated_data.get("campus")
            self._validate_leaders(serializer.validated_data, campus_obj.id if campus_obj else None)
            dept = serializer.save()
        _sync_department_leaders(dept, deputy_permissions=self._get_requested_deputy_permissions())

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        eff_role = _effective_role(user)
        eff_user = _effective_user(user)

        if eff_role == "ADMIN_DEPT" and instance.admin_id != (eff_user.id if eff_user else user.id):
            raise PermissionDenied("Vous ne pouvez modifier que le département dont vous êtes le responsable.")

        if _is_deputy_Account(user) and "deputy" in serializer.validated_data and serializer.validated_data["deputy"] != instance.deputy:
            raise PermissionDenied("Un adjoint ne peut pas désigner ou modifier l'adjoint d'un département.")

        if eff_role not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            if "admin" in serializer.validated_data and serializer.validated_data["admin"] != instance.admin:
                raise PermissionDenied("Seul le Super Admin peut modifier l'administrateur titulaire d'un département.")
            if "is_active" in serializer.validated_data and serializer.validated_data["is_active"] != instance.is_active:
                raise PermissionDenied("Seul le Super Admin peut activer ou désactiver un département.")

        old_deputy = instance.deputy

        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if str(instance.campus_id) != str(campus_id):
                raise PermissionDenied("Ce département n'appartient pas à votre Église.")
            self._validate_leaders(serializer.validated_data, campus_id, instance=instance)
            dept = serializer.save(campus_id=campus_id)
        else:
            campus_obj = serializer.validated_data.get("campus", instance.campus)
            self._validate_leaders(serializer.validated_data, campus_obj.id if campus_obj else instance.campus_id, instance=instance)
            dept = serializer.save()

        if old_deputy and old_deputy.pk != dept.deputy_id:
            _revoke_user_deputy_status(old_deputy, exclude_dept_id=dept.id)

        _sync_department_leaders(dept, deputy_permissions=self._get_requested_deputy_permissions())



