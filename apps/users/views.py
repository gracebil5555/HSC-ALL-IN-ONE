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
      - SUPER_SUPER_ADMIN : voit tous les utilisateurs du réseau.
      - SUPER_ADMIN       : voit uniquement les utilisateurs de son campus.
      - ADMIN_DEPT / ADJOINT / MEMBRE : ne peuvent accéder qu'à leur propre profil.
    """
    queryset = User.objects.select_related("campus", "deputy_of").all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from .permissions import _has_role

        # SUPER_SUPER_ADMIN — réseau complet
        if _has_role(user, "SUPER_SUPER_ADMIN"):
            return self.queryset

        # SUPER_ADMIN — campus uniquement
        if _has_role(user, "SUPER_ADMIN") and user.campus_id:
            return self.queryset.filter(campus_id=user.campus_id)

        # Autres rôles — profil propre seulement
        return self.queryset.filter(pk=user.pk)

    def get_permissions(self):
        """
        Surcharge des permissions selon l'action :
          - list / retrieve / me → tout utilisateur authentifié (filtré ci-dessus)
          - create / update / delete → réservé au Super Admin ou supérieur
        """
        if self.action in ("create", "update", "partial_update", "destroy"):
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

    @action(detail=False, methods=["get"], url_path="by-role")
    def by_role(self, request):
        """
        Liste les utilisateurs filtrés par rôle.
        Query param : ?role=SUPER_ADMIN
        Réservé au Super Admin+.
        """
        from .permissions import _has_role, IsSuperAdmin
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
