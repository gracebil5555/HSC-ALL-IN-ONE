"""
Permissions RBAC pour le système HSC.

Hiérarchie des rôles :
  SUPER_SUPER_ADMIN  > SUPER_ADMIN  > ADMIN_DEPT  > ADJOINT  > MEMBRE
"""
from rest_framework.permissions import BasePermission


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _has_role(user, *roles):
    """Renvoie True si l'utilisateur possède l'un des rôles donnés."""
    return user.is_authenticated and getattr(user, "role", None) in roles


def _same_campus(user, obj):
    """Vérifie que l'objet appartient au même campus que l'utilisateur."""
    obj_campus = getattr(obj, "campus_id", None) or getattr(obj, "campus", None)
    if obj_campus is None:
        return False
    obj_campus_id = getattr(obj_campus, "id", obj_campus)
    return str(user.campus_id) == str(obj_campus_id)


# ---------------------------------------------------------------------------
# Niveau 1 – Super Super Admin (vue globale)
# ---------------------------------------------------------------------------

class IsSuperSuperAdmin(BasePermission):
    """Accès réservé au Super Super Admin (gestion du réseau mondial HSC)."""
    message = "Réservé au Super Super Administrateur du réseau HSC."

    def has_permission(self, request, view):
        return _has_role(request.user, "SUPER_SUPER_ADMIN")


# ---------------------------------------------------------------------------
# Niveau 2 – Super Admin (directeur d'une église / extension)
# ---------------------------------------------------------------------------

class IsSuperAdmin(BasePermission):
    """Super Admin ou Super Super Admin."""
    message = "Réservé aux Supers Administrateurs d'église."

    def has_permission(self, request, view):
        return _has_role(request.user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN")


class IsSuperAdminOfCampus(BasePermission):
    """Super Admin limité à son campus + Super Super Admin (global)."""
    message = "Vous n'avez pas les droits sur ce campus."

    def has_permission(self, request, view):
        return _has_role(request.user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN")

    def has_object_permission(self, request, view, obj):
        if _has_role(request.user, "SUPER_SUPER_ADMIN"):
            return True
        return _same_campus(request.user, obj)


# ---------------------------------------------------------------------------
# Niveau 3 – Admin Département
# ---------------------------------------------------------------------------

class IsAdminDept(BasePermission):
    """Admin de département ou tout rôle supérieur."""
    message = "Réservé aux administrateurs de département."

    def has_permission(self, request, view):
        return _has_role(
            request.user,
            "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"
        )


class IsAdminDeptOfCampus(BasePermission):
    """Admin Dept limité à son campus."""
    message = "Vous n'avez pas les droits sur ce département / campus."

    def has_permission(self, request, view):
        return _has_role(
            request.user,
            "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"
        )

    def has_object_permission(self, request, view, obj):
        if _has_role(request.user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            return True
        return _same_campus(request.user, obj)


# ---------------------------------------------------------------------------
# Niveau 4 – Adjoint (délégué)
# ---------------------------------------------------------------------------

class IsAdjointOrAbove(BasePermission):
    """Adjoint ou tout rôle supérieur."""
    message = "Réservé aux adjoints et aux administrateurs."

    def has_permission(self, request, view):
        return _has_role(
            request.user,
            "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT", "ADJOINT"
        )


class AdjointCanPerformAction(BasePermission):
    """
    Vérifie si un adjoint a bien la permission spécifique dans son JSON
    `delegated_permissions`. Le nom de la permission est passé via
    `view.adjoint_required_permission` (str).
    """
    message = "Votre délégation ne couvre pas cette action."

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        # Rôles supérieurs → toujours autorisés
        if _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"):
            return True
        # Adjoint → vérifier la permission déléguée
        if _has_role(user, "ADJOINT"):
            required = getattr(view, "adjoint_required_permission", None)
            if required is None:
                return True  # aucune restriction spécifiée
            delegated = user.delegated_permissions or []
            return required in delegated
        return False


# ---------------------------------------------------------------------------
# Mixins utilitaires pour les ViewSets
# ---------------------------------------------------------------------------

class RoleFilterMixin:
    """
    Mixin pour filtrer automatiquement les querysets selon le campus de l'utilisateur.
    À utiliser dans les ViewSets qui portent un champ `campus` ou `campus_id`.
    """

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # SUPER_SUPER_ADMIN voit tout
        if _has_role(user, "SUPER_SUPER_ADMIN"):
            return qs
        # Tous les autres rôles → filtrer sur le campus
        campus_id = getattr(user, "campus_id", None)
        if campus_id:
            # Tente campus__id puis campus_id selon le modèle
            if qs.model._meta.get_field("campus"):
                return qs.filter(campus_id=campus_id)
        return qs.none()
