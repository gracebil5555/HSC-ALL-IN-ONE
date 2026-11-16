from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import User
from .serializers import UserSerializer
from .permissions import (
    IsSuperAdmin,
    IsAdminDept,
    RoleFilterMixin,
    _has_role,
    _effective_role,
    _effective_campus_id,
)


class UserViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    CRUD Utilisateurs & Délégation d'Adjoints (Sections 4 à 7 & 15) :
      - SUPER_SUPER_ADMIN : voit et gère tous les utilisateurs du réseau mondial.
      - SUPER_ADMIN       : voit et gère uniquement les utilisateurs de son Église / extension.
      - ADMIN_DEPT        : voit les membres/utilisateurs de son campus et peut désigner son propre adjoint.
      - ADJOINT           : agit selon le périmètre de son titulaire et ses permissions déléguées.
    """
    queryset = User.objects.select_related("campus", "deputy_of").prefetch_related(
        "administered_departments", "deputy_departments"
    ).all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset
        eff_role = _effective_role(user)

        # 1. SUPER_SUPER_ADMIN — réseau complet avec filtres optionnels
        if eff_role == "SUPER_SUPER_ADMIN":
            campus_id = self.request.query_params.get("campus_id")
            if campus_id and campus_id != "all":
                qs = qs.filter(campus_id=campus_id)
            role = self.request.query_params.get("role")
            if role and role != "ALL":
                qs = qs.filter(role=role)
            return qs

        # 2. SUPER_ADMIN / ADMIN_DEPT — isolation stricte sur leur campus
        campus_id = _effective_campus_id(user)
        if eff_role in ("SUPER_ADMIN", "ADMIN_DEPT") and campus_id:
            qs = qs.filter(campus_id=campus_id)
            role = self.request.query_params.get("role")
            if role and role != "ALL":
                qs = qs.filter(role=role)
            return qs

        # 3. Autres rôles — profil propre uniquement
        return self.queryset.filter(pk=user.pk)

    def get_permissions(self):
        """
        Permissions par action :
          - create / update / delete : Super Admin d'Église ou Super Super Admin
          - assign_deputy / revoke_deputy : Titulaire à chaque niveau (Super Super Admin, Super Admin, Admin Dept)
          - list / retrieve / me / contacts : Authentifié (filtré par get_queryset)
        """
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsSuperAdmin()]
        if self.action in ("assign_deputy", "revoke_deputy"):
            return [IsAuthenticated(), IsAdminDept()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Contrôle d'accès strict RBAC à la création d'utilisateurs :
          - Seul le SUPER_SUPER_ADMIN peut nommer un SUPER_ADMIN ou un autre SUPER_SUPER_ADMIN.
          - Un SUPER_ADMIN crée uniquement des comptes (ADMIN_DEPT, ADJOINT, MEMBRE) verrouillés sur son campus.
        """
        creator = self.request.user
        target_role = serializer.validated_data.get("role", "MEMBRE")

        if _effective_role(creator) != "SUPER_SUPER_ADMIN":
            if target_role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
                raise PermissionDenied(
                    "Action refusée : Seul le Super Super Admin a l'autorité de créer ou nommer un Super Admin d'Église."
                )
            campus_id = _effective_campus_id(creator)
            if not campus_id:
                raise PermissionDenied("Action refusée : Aucun campus rattaché à votre compte.")
            serializer.save(campus_id=campus_id)
            return

        serializer.save()

    def perform_update(self, serializer):
        """Contrôle d'accès strict RBAC lors de la modification d'un utilisateur."""
        creator = self.request.user
        instance = serializer.instance
        target_role = serializer.validated_data.get("role", instance.role)

        if _effective_role(creator) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(creator)
            if str(instance.campus_id) != str(campus_id):
                raise PermissionDenied("Action refusée : Cet utilisateur n'appartient pas à votre Église.")
            if target_role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN") and instance.role != target_role:
                raise PermissionDenied(
                    "Action refusée : Seul le Super Super Admin peut promouvoir un utilisateur au rang de Super Admin."
                )
            serializer.save(campus_id=campus_id)
            return

        serializer.save()

    def perform_destroy(self, instance):
        creator = self.request.user
        if instance.pk == creator.pk:
            raise PermissionDenied("Vous ne pouvez pas supprimer votre propre compte.")
        if _effective_role(creator) != "SUPER_SUPER_ADMIN":
            if str(instance.campus_id) != str(_effective_campus_id(creator)):
                raise PermissionDenied("Action refusée : Cet utilisateur n'appartient pas à votre Église.")
            if instance.role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
                raise PermissionDenied("Action refusée : Seul le Super Super Admin peut supprimer un Super Admin.")
        instance.delete()

    # ------------------------------------------------------------------
    # Actions personnalisées
    # ------------------------------------------------------------------

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        """Retourne le profil complet de l'utilisateur connecté."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="contacts")
    def contacts(self, request):
        """
        Carnet de contacts organisationnel (Section 24).
        Isolé par Église pour les rôles locaux, ou consolidé pour le Super Super Admin.
        """
        user = request.user
        eff_role = _effective_role(user)
        if eff_role == "SUPER_SUPER_ADMIN":
            qs = self.queryset.filter(is_active=True)
            campus_id = request.query_params.get("campus_id")
            if campus_id and campus_id != "all":
                qs = qs.filter(campus_id=campus_id)
        else:
            campus_id = _effective_campus_id(user)
            qs = self.queryset.filter(is_active=True, campus_id=campus_id) if campus_id else self.queryset.none()

        qs = qs.order_by("last_name", "first_name")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="assign-deputy")
    def assign_deputy(self, request, pk=None):
        """
        Assigne un adjoint au titulaire cible avec permissions granulaires (Sections 7 & 15).
        Autorisé à chaque niveau :
          - Super Super Admin (pour lui-même ou tout responsable)
          - Super Admin d'Église (pour lui-même ou un Admin Dept de son Église)
          - Admin de Département (pour lui-même dans son département)
        """
        from apps.departments.models import Department

        actor = request.user
        eff_role = _effective_role(actor)
        titulaire = self.get_object()
        deputy_id = request.data.get("deputy_id")
        permissions = request.data.get("delegated_permissions", [])

        if not deputy_id:
            return Response(
                {"detail": "Le paramètre deputy_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérification des droits du titulaire
        if eff_role == "ADMIN_DEPT" and titulaire.pk != actor.pk:
            raise PermissionDenied("Un Admin de département ne peut désigner un adjoint que pour lui-même.")
        if eff_role != "SUPER_SUPER_ADMIN":
            actor_campus_id = _effective_campus_id(actor)
            if str(titulaire.campus_id) != str(actor_campus_id):
                raise PermissionDenied("Vous ne pouvez gérer les adjoints que dans le périmètre de votre Église.")

        try:
            deputy = User.objects.get(pk=deputy_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Utilisateur adjoint introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if eff_role != "SUPER_SUPER_ADMIN" and str(deputy.campus_id) != str(_effective_campus_id(actor)):
            raise PermissionDenied("L'adjoint choisi doit appartenir à la même Église.")

        # Configurer l'adjoint dans le même périmètre que son responsable
        deputy.is_deputy = True
        deputy.deputy_of = titulaire
        deputy.delegated_permissions = permissions
        if titulaire.campus_id and not deputy.campus_id:
            deputy.campus_id = titulaire.campus_id
        if deputy.role == "MEMBRE":
            deputy.role = "ADJOINT"
        deputy.save()

        # Si le titulaire administre un département, synchroniser l'adjoint du département
        if titulaire.role == "ADMIN_DEPT":
            Department.objects.filter(admin=titulaire, is_active=True).update(deputy=deputy)

        return Response({
            "detail": f"{deputy.get_full_name()} est maintenant l'adjoint de {titulaire.get_full_name()}.",
            "titulaire_id": titulaire.id,
            "deputy_id": deputy.id,
            "delegated_permissions": deputy.delegated_permissions,
        })

    @action(detail=True, methods=["post"], url_path="revoke-deputy")
    def revoke_deputy(self, request, pk=None):
        """
        Révoque le rôle d'adjoint d'un utilisateur cible (Section 7).
        """
        from apps.departments.models import Department

        actor = request.user
        eff_role = _effective_role(actor)
        deputy = self.get_object()

        if eff_role == "ADMIN_DEPT" and deputy.deputy_of_id != actor.pk:
            raise PermissionDenied("Vous ne pouvez révoquer que votre propre adjoint.")
        if eff_role != "SUPER_SUPER_ADMIN" and str(deputy.campus_id) != str(_effective_campus_id(actor)):
            raise PermissionDenied("Cet adjoint n'appartient pas au périmètre de votre Église.")

        Department.objects.filter(deputy=deputy).update(deputy=None)

        deputy.is_deputy = False
        deputy.deputy_of = None
        deputy.delegated_permissions = []
        if deputy.role == "ADJOINT":
            deputy.role = "MEMBRE"
        deputy.save()

        return Response({
            "detail": f"La fonction d'adjoint de {deputy.get_full_name()} a été révoquée.",
            "user_id": deputy.id,
        })

    @action(detail=False, methods=["get"], url_path="by-role")
    def by_role(self, request):
        """Liste les utilisateurs filtrés par rôle dans le périmètre autorisé."""
        if not _has_role(request.user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT"):
            return Response(
                {"detail": "Permission insuffisante."},
                status=status.HTTP_403_FORBIDDEN,
            )
        role = request.query_params.get("role")
        qs = self.get_queryset()
        if role:
            qs = qs.filter(role=role)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


