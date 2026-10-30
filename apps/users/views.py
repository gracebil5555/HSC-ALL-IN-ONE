from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer
from .permissions import IsSuperAdmin, RoleFilterMixin


class UserViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    CRUD Utilisateurs — accès filtré selon le rôle :
      - SUPER_SUPER_ADMIN : voit tous les utilisateurs du réseau (filtrage optionnel par ?campus_id= et ?role=).
      - SUPER_ADMIN       : voit uniquement les utilisateurs de son campus.
      - ADMIN_DEPT / ADJOINT / MEMBRE : ne peuvent accéder qu'à leur propre profil.
    """
    queryset = User.objects.select_related("campus", "deputy_of").all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from .permissions import _has_role

        qs = self.queryset
        # SUPER_SUPER_ADMIN — réseau complet avec filtres
        if _has_role(user, "SUPER_SUPER_ADMIN"):
            campus_id = self.request.query_params.get("campus_id")
            if campus_id and campus_id != "all":
                qs = qs.filter(campus_id=campus_id)
            role = self.request.query_params.get("role")
            if role:
                qs = qs.filter(role=role)
            return qs

        # SUPER_ADMIN — campus uniquement
        if _has_role(user, "SUPER_ADMIN") and user.campus_id:
            qs = qs.filter(campus_id=user.campus_id)
            role = self.request.query_params.get("role")
            if role:
                qs = qs.filter(role=role)
            return qs

        # Autres rôles — profil propre seulement
        return self.queryset.filter(pk=user.pk)

    def get_permissions(self):
        """
        Surcharge des permissions selon l'action :
          - list / retrieve / me / contacts → tout utilisateur authentifié (filtré ci-dessus)
          - create / update / delete → réservé au Super Admin ou supérieur
        """
        if self.action in ("create", "update", "partial_update", "destroy", "assign_deputy", "revoke_deputy"):
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]

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
        Retourne les personnes clés de l'église (ou du réseau pour SSA) :
        responsables de structures, adjoints, pasteurs, diacres, bergers.
        """
        qs = self.get_queryset().filter(is_active=True).order_by("last_name", "first_name")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="assign-deputy")
    def assign_deputy(self, request, pk=None):
        """
        Assigne un adjoint au titulaire cible (Section 7).
        Body : {
          "deputy_id": 12,
          "delegated_permissions": ["voir", "creer", "valider", ...]
        }
        """
        titulaire = self.get_object()
        deputy_id = request.data.get("deputy_id")
        permissions = request.data.get("delegated_permissions", [])

        if not deputy_id:
            return Response(
                {"detail": "Le paramètre deputy_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            deputy = User.objects.get(pk=deputy_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Utilisateur adjoint introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Configurer l'adjoint
        deputy.is_deputy = True
        deputy.deputy_of = titulaire
        deputy.delegated_permissions = permissions
        if deputy.role == "MEMBRE":
            deputy.role = "ADJOINT"
        deputy.save()

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
        deputy = self.get_object()
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
        """
        Liste les utilisateurs filtrés par rôle.
        Query param : ?role=SUPER_ADMIN
        Réservé au Super Admin+.
        """
        from .permissions import _has_role
        if not _has_role(request.user, "SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
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

