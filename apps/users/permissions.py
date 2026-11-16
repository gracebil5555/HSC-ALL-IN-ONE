"""
Permissions RBAC pour le système HSC.

Hiérarchie des rôles (Sections 4 à 9 & 15) :
  1. Niveau Global    : SUPER_SUPER_ADMIN (+ Adjoint global)
  2. Niveau Église    : SUPER_ADMIN       (+ Adjoint d'église)
  3. Niveau Structure : ADMIN_DEPT        (+ Adjoint de département / GDC / brigade)
  4. Niveau Membre    : MEMBRE

Règles clés :
  - L'adjoint travaille dans le même périmètre que son responsable (deputy_of),
    limité aux permissions granulaires déléguées :
    ['voir', 'creer', 'modifier', 'supprimer', 'valider', 'exporter', 'administrer'].
  - Isolation stricte des données par Église / Campus.
  - Isolation entre départements (ex: Admin Finance vs Admin Patrimoine).
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


# ---------------------------------------------------------------------------
# Helpers de résolution de rôle, périmètre et permissions granulaires
# ---------------------------------------------------------------------------

def _effective_user(user):
    """
    Si l'utilisateur est un adjoint (is_deputy=True) rattaché à un titulaire (deputy_of),
    retourne le titulaire pour hériter de son périmètre organisationnel.
    """
    if not user or not user.is_authenticated:
        return None
    if getattr(user, "is_deputy", False) and getattr(user, "deputy_of_id", None):
        return user.deputy_of
    return user


def _effective_role(user):
    """
    Retourne le niveau hiérarchique effectif de l'utilisateur.
    Un adjoint hérite du niveau de périmètre de son titulaire (SUPER_SUPER_ADMIN,
    SUPER_ADMIN ou ADMIN_DEPT) tout en restant soumis à ses delegated_permissions.
    """
    if not user or not user.is_authenticated:
        return None
    role = getattr(user, "role", None)
    if role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"):
        return role
    if getattr(user, "is_deputy", False) and getattr(user, "deputy_of_id", None):
        return getattr(user.deputy_of, "role", "ADJOINT")
    return role


def _effective_campus_id(user):
    """
    Retourne le campus_id du périmètre de l'utilisateur (None pour le niveau Global).
    """
    if not user or not user.is_authenticated:
        return None
    if _effective_role(user) == "SUPER_SUPER_ADMIN":
        return None
    eff_user = _effective_user(user)
    return getattr(eff_user, "campus_id", None) or getattr(user, "campus_id", None)


def _has_role(user, *roles):
    """
    Renvoie True si l'utilisateur (ou son titulaire s'il est adjoint) possède l'un des rôles.
    """
    if not user or not user.is_authenticated:
        return False
    direct_role = getattr(user, "role", None)
    eff_role = _effective_role(user)
    return direct_role in roles or eff_role in roles


def _is_deputy_Account(user):
    """Indique si l'utilisateur agit en tant qu'adjoint soumis à délégation."""
    if not user or not user.is_authenticated:
        return False
    return bool(getattr(user, "is_deputy", False) or getattr(user, "role", None) == "ADJOINT")


def _has_granular_permission(user, perm):
    """
    Vérifie qu'un utilisateur dispose de la permission granulaire demandée :
    'voir', 'creer', 'modifier', 'supprimer', 'valider', 'exporter', 'administrer'.
    Les titulaires (non-adjoints) ont toutes les permissions de leur périmètre.
    """
    if not user or not user.is_authenticated:
        return False
    if not _is_deputy_Account(user):
        return _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT")
    delegated = getattr(user, "delegated_permissions", None) or []
    if "administrer" in delegated:
        return True
    return perm in delegated


def _same_campus(user, obj):
    """Vérifie que l'objet appartient au même campus que le périmètre de l'utilisateur."""
    if _effective_role(user) == "SUPER_SUPER_ADMIN":
        return True
    user_campus_id = _effective_campus_id(user)
    if not user_campus_id:
        return False
    if obj.__class__.__name__ == "Campus":
        return str(obj.id) == str(user_campus_id)
    obj_campus = getattr(obj, "campus_id", None) or getattr(obj, "campus", None)
    if obj_campus is None:
        return False
    obj_campus_id = getattr(obj_campus, "id", obj_campus)
    return str(user_campus_id) == str(obj_campus_id)


def _get_user_department_codes(user):
    """
    Retourne l'ensemble des codes de départements administrés par l'utilisateur
    (ou par son titulaire s'il est adjoint).
    """
    if not user or not user.is_authenticated:
        return set()
    codes = set()
    eff_user = _effective_user(user)
    for target in {user, eff_user}:
        if not target:
            continue
        if hasattr(target, "administered_departments"):
            for d in target.administered_departments.filter(is_active=True):
                if d.code:
                    codes.add(d.code.upper())
                if d.catalog_item and d.catalog_item.code:
                    codes.add(d.catalog_item.code.upper())
        if hasattr(target, "deputy_departments"):
            for d in target.deputy_departments.filter(is_active=True):
                if d.code:
                    codes.add(d.code.upper())
                if d.catalog_item and d.catalog_item.code:
                    codes.add(d.catalog_item.code.upper())
        # Fallback par mots-clés du titre si aucun département n'est encore lié en base
        title = (getattr(target, "title", "") or "").lower()
        if any(k in title for k in ("caisse", "financ", "trésor", "tresor", "comptab")):
            codes.add("FINANCES")
        if any(k in title for k in ("patrimoine", "logist", "matériel", "materiel", "stock")):
            codes.add("PATRIMOINE")
        if any(k in title for k in ("chorale", "louange", "musique", "chant")):
            codes.add("CHORALE")
        if any(k in title for k in ("accueil", "protocole", "intégration", "integration")):
            codes.add("ACCUEIL")
        if any(k in title for k in ("social", "entraide", "diacon")):
            codes.add("SOCIAL")
        if any(k in title for k in ("secrétariat", "secretariat")):
            codes.add("SECRETARIAT")
        if any(k in title for k in ("brigade", "gdc", "berger")):
            codes.add("BRIGADE")
    return codes


def _required_perm_for_method(method, action=None):
    """Associe chaque méthode HTTP / action DRF à une permission granulaire (Section 15)."""
    if action in ("approve", "disburse", "validate"):
        return "valider"
    if action in ("export",):
        return "exporter"
    if action in ("assign_deputy", "revoke_deputy"):
        return "administrer"
    if method in SAFE_METHODS:
        return "voir"
    if method == "POST":
        return "creer"
    if method in ("PUT", "PATCH"):
        return "modifier"
    if method == "DELETE":
        return "supprimer"
    return "voir"


# ---------------------------------------------------------------------------
# Niveau 1 – Super Super Admin (vue globale)
# ---------------------------------------------------------------------------

class IsSuperSuperAdmin(BasePermission):
    """
    Accès réservé au Super Super Admin.
    Note (Section 5 & 15) : La création d'une extension globale appartient uniquement
    au Super Super Admin (ou à son adjoint global ayant la permission requise).
    """
    message = "Réservé au Super Super Administrateur du réseau HSC."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "role", None) == "SUPER_SUPER_ADMIN" and not getattr(user, "is_deputy", False):
            return True
        if _effective_role(user) == "SUPER_SUPER_ADMIN" and _is_deputy_Account(user):
            perm = _required_perm_for_method(request.method, getattr(view, "action", None))
            return _has_granular_permission(user, perm)
        return False


# ---------------------------------------------------------------------------
# Niveau 2 – Super Admin (directeur d'une église / extension)
# ---------------------------------------------------------------------------

class IsSuperAdmin(BasePermission):
    """Super Admin d'Église ou Super Super Admin (ou leur adjoint autorisé)."""
    message = "Réservé aux Supers Administrateurs d'église."

    def has_permission(self, request, view):
        user = request.user
        if not _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            return False
        if _is_deputy_Account(user):
            perm = _required_perm_for_method(request.method, getattr(view, "action", None))
            return _has_granular_permission(user, perm)
        return True


class IsSuperAdminOfCampus(BasePermission):
    """Super Admin limité à son campus + Super Super Admin (global)."""
    message = "Vous n'avez pas les droits sur ce campus."

    def has_permission(self, request, view):
        return IsSuperAdmin().has_permission(request, view)

    def has_object_permission(self, request, view, obj):
        return _same_campus(request.user, obj)


# ---------------------------------------------------------------------------
# Niveau 3 – Admin Département / Structure
# ---------------------------------------------------------------------------

class IsAdminDept(BasePermission):
    """Admin de département ou tout rôle supérieur (avec contrôle de délégation pour adjoint)."""
    message = "Réservé aux administrateurs de département."

    def has_permission(self, request, view):
        user = request.user
        if not _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"):
            return False
        if _is_deputy_Account(user):
            perm = _required_perm_for_method(request.method, getattr(view, "action", None))
            return _has_granular_permission(user, perm)
        return True


class IsAdminDeptOfCampus(BasePermission):
    """Admin Dept limité à son campus (et à son département si spécifié sur la vue)."""
    message = "Vous n'avez pas les droits sur ce département ou ce campus."

    def has_permission(self, request, view):
        user = request.user
        if not IsAdminDept().has_permission(request, view):
            return False
        # Si la vue exige un département spécifique (ex: FINANCES ou PATRIMOINE)
        allowed_dept_codes = getattr(view, "allowed_department_codes", None)
        if allowed_dept_codes and _effective_role(user) == "ADMIN_DEPT":
            user_codes = _get_user_department_codes(user)
            if not user_codes.intersection({c.upper() for c in allowed_dept_codes}):
                return False
        return True

    def has_object_permission(self, request, view, obj):
        return _same_campus(request.user, obj)


# ---------------------------------------------------------------------------
# Niveau 4 – Adjoint (délégué)
# ---------------------------------------------------------------------------

class IsAdjointOrAbove(BasePermission):
    """Adjoint ou tout rôle supérieur."""
    message = "Réservé aux adjoints et aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        if not _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT", "ADJOINT"):
            return False
        if _is_deputy_Account(user):
            perm = _required_perm_for_method(request.method, getattr(view, "action", None))
            return _has_granular_permission(user, perm)
        return True


class AdjointCanPerformAction(BasePermission):
    """
    Vérifie si un adjoint a bien la permission spécifique dans son JSON
    `delegated_permissions`.
    """
    message = "Votre délégation ne couvre pas cette action."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if not _is_deputy_Account(user):
            return _has_role(user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT")
        required = getattr(view, "adjoint_required_permission", None) or _required_perm_for_method(
            request.method, getattr(view, "action", None)
        )
        return _has_granular_permission(user, required)


# ---------------------------------------------------------------------------
# Mixins utilitaires pour les ViewSets (Isolation Multi-Tenant & RBAC)
# ---------------------------------------------------------------------------

class RoleFilterMixin:
    """
    Mixin d'isolation stricte par Église/Campus et de contrôle des permissions (Section 16 & 20) :
      - SUPER_SUPER_ADMIN (ou son adjoint global) voit tous les campus (filtrable par ?campus_id=).
      - SUPER_ADMIN / ADMIN_DEPT / ADJOINT / MEMBRE ne voient et ne créent QUE dans leur campus.
    """

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if not user or not user.is_authenticated:
            return qs.none()

        model_fields = {f.name for f in qs.model._meta.get_fields()}
        has_campus_field = "campus" in model_fields

        # Niveau Global (Super Super Admin ou son adjoint)
        if _effective_role(user) == "SUPER_SUPER_ADMIN":
            campus_param = self.request.query_params.get("campus_id") or self.request.query_params.get("campus")
            if campus_param and campus_param != "all" and has_campus_field:
                return qs.filter(campus_id=campus_param)
            return qs

        # Niveau Église / Structure : isolation stricte sur le campus de l'utilisateur
        campus_id = _effective_campus_id(user)
        if campus_id and has_campus_field:
            return qs.filter(campus_id=campus_id)
        return qs.none()

    def perform_create(self, serializer):
        """
        Force automatiquement le campus de l'utilisateur connecté (sauf Super Super Admin)
        pour empêcher toute fuite de périmètre lors de la création d'enregistrements.
        """
        user = self.request.user
        model_fields = {f.name for f in serializer.Meta.model._meta.get_fields()}
        if "campus" in model_fields and _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if campus_id:
                serializer.save(campus_id=campus_id)
                return
        serializer.save()

