from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from apps.core.models import log_audit_event
from .models import User, RoleAssignment
from .serializers import UserSerializer, RoleAssignmentSerializer
from .permissions import (
    IsSuperAdmin,
    IsAdminDept,
    RoleFilterMixin,
    _has_role,
    _effective_role,
    _effective_campus_id,
    _is_deputy_Account,
)

ROLE_RANK = {
    "MEMBRE": 1,
    "ADJOINT": 2,
    "ADMIN_DEPT": 3,
    "SUPER_ADMIN": 4,
    "SUPER_SUPER_ADMIN": 5,
}


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

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        """
        Retourne ou met à jour le profil personnel de l'utilisateur connecté
        (prénom, nom, email, téléphone, titre, photo de profil, mot de passe).
        """
        user = request.user
        if request.method == "GET":
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        allowed_fields = ("first_name", "last_name", "email", "phone", "title", "avatar")
        updated_fields = []
        for field in allowed_fields:
            if field in request.data:
                val = request.data.get(field)
                if field == "avatar":
                    if val is None or val == "":
                        val = None
                    elif isinstance(val, str):
                        val = val.strip()
                        if not (
                            val.startswith("https://")
                            or val.startswith("http://")
                            or val.startswith("data:image/")
                        ):
                            return Response(
                                {"avatar": "L'avatar doit être une URL http(s) ou une image valide."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                        if len(val) > 500_000:
                            return Response(
                                {"avatar": "L'image est trop volumineuse (max 500 Ko)."},
                                status=status.HTTP_400_BAD_REQUEST,
                            )
                setattr(user, field, val if val is not None or field == "avatar" else "")
                updated_fields.append(field)

        new_password = request.data.get("new_password")
        if new_password:
            current_password = request.data.get("current_password") or ""
            if not user.check_password(current_password):
                return Response(
                    {"current_password": "Mot de passe actuel incorrect."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            from django.contrib.auth.password_validation import validate_password
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_password(new_password, user)
            except DjangoValidationError as exc:
                return Response(
                    {"new_password": list(exc.messages)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)
            updated_fields.append("password")

        if updated_fields:
            user.save(update_fields=updated_fields)
            log_audit_event(
                actor=user,
                action="USER_PROFILE_UPDATED",
                target_model="User",
                target_id=user.id,
                campus=user.campus,
                description=f"Mise à jour du profil personnel ({', '.join(updated_fields)})",
                request=request,
            )

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="contacts")
    def contacts(self, request):
        """
        Carnet de contacts organisationnel unifié (Section 24).
        Unifie responsables (User) et membres/officiers (Member) selon les droits,
        avec filtres par fonction ecclésiale, département et statut d'activité.
        """
        from django.db.models import Q
        from apps.members.models import Member, EcclesialFunctionCatalog, MemberStatusCatalog
        from apps.users.permissions import _get_user_department_codes

        user = request.user
        eff_role = _effective_role(user)
        campus_param = request.query_params.get("campus_id")
        func_param = request.query_params.get("ecclesial_function")
        dept_param = request.query_params.get("department_id")
        status_param = request.query_params.get("status")
        include_members = request.query_params.get("include_members", "true").lower() != "false"

        if eff_role == "SUPER_SUPER_ADMIN":
            user_qs = self.queryset
            if campus_param and campus_param != "all":
                user_qs = user_qs.filter(campus_id=campus_param)
        else:
            campus_id = _effective_campus_id(user)
            user_qs = self.queryset.filter(campus_id=campus_id) if campus_id else self.queryset.none()

        if status_param and status_param != "ALL":
            if status_param in ("ACTIF", "ACTIVE", "TRUE"):
                user_qs = user_qs.filter(is_active=True)
            elif status_param in ("INACTIF", "SUSPENDU", "INACTIVE", "FALSE"):
                user_qs = user_qs.filter(is_active=False)
            else:
                user_qs = user_qs.none()
        else:
            user_qs = user_qs.filter(is_active=True)

        if func_param and func_param != "ALL":
            user_qs = user_qs.filter(ecclesial_function=func_param)

        if dept_param and dept_param != "ALL":
            user_qs = user_qs.filter(
                Q(administered_departments__id=dept_param) | Q(deputy_departments__id=dept_param)
            ).distinct()

        user_qs = user_qs.order_by("last_name", "first_name")
        serialized_users = self.get_serializer(user_qs, many=True).data

        results = []
        seen_phones = set()
        for u in serialized_users:
            item = dict(u)
            item["source_type"] = "USER"
            item["status"] = "ACTIF" if u.get("is_active", True) else "INACTIF"
            item["status_display"] = "Actif" if u.get("is_active", True) else "Inactif"
            admin_depts = u.get("administered_departments") or []
            if admin_depts and not item.get("department_id"):
                item["department_id"] = admin_depts[0].get("id")
                item["department_name"] = admin_depts[0].get("name")
            phone_norm = (u.get("phone") or "").strip()
            if phone_norm:
                seen_phones.add(phone_norm)
            results.append(item)

        # Unification avec les membres/officiers selon les droits (Section 20)
        dept_codes = _get_user_department_codes(user)
        is_isolated_non_member = (
            eff_role == "ADMIN_DEPT"
            and dept_codes
            and dept_codes.issubset({"FINANCES", "PATRIMOINE"})
        )
        can_include_members = include_members and eff_role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN", "ADMIN_DEPT") and not is_isolated_non_member

        if can_include_members:
            member_qs = Member.objects.select_related("campus", "department").all()
            if eff_role == "SUPER_SUPER_ADMIN":
                if campus_param and campus_param != "all":
                    member_qs = member_qs.filter(campus_id=campus_param)
            else:
                campus_id = _effective_campus_id(user)
                if not campus_id:
                    member_qs = member_qs.none()
                else:
                    member_qs = member_qs.filter(campus_id=campus_id)
                    if eff_role == "ADMIN_DEPT" and not dept_codes.intersection({"ACCUEIL", "SECRETARIAT", "SOCIAL", "BRIGADE", "GDC"}):
                        dept_ids = set(user.administered_departments.filter(is_active=True).values_list("id", flat=True))
                        dept_ids.update(user.deputy_departments.filter(is_active=True).values_list("id", flat=True))
                        member_qs = member_qs.filter(department_id__in=dept_ids) if dept_ids else member_qs.none()

            if func_param and func_param != "ALL":
                member_qs = member_qs.filter(ecclesial_function=func_param)
            if dept_param and dept_param != "ALL":
                member_qs = member_qs.filter(department_id=dept_param)
            if status_param and status_param != "ALL":
                member_qs = member_qs.filter(status=status_param)

            func_labels = dict(EcclesialFunctionCatalog.objects.values_list("code", "label"))
            func_labels.update({k: v for k, v in Member.ECCLESIAL_FUNCTION_CHOICES if k not in func_labels})
            status_labels = dict(MemberStatusCatalog.objects.values_list("code", "label"))
            status_labels.update({k: v for k, v in Member.STATUS_CHOICES if k not in status_labels})

            for m in member_qs.order_by("last_name", "first_name"):
                phone_norm = (m.phone or "").strip()
                if phone_norm and phone_norm in seen_phones:
                    continue
                if phone_norm:
                    seen_phones.add(phone_norm)
                results.append({
                    "id": f"member-{m.id}",
                    "member_id": m.id,
                    "source_type": "MEMBER",
                    "username": f"member.{m.id}",
                    "first_name": m.first_name,
                    "last_name": m.last_name,
                    "email": m.email or "",
                    "phone": m.phone or "",
                    "title": "",
                    "role": "MEMBRE",
                    "role_display": "Membre / Officier",
                    "effective_role": "MEMBRE",
                    "ecclesial_function": m.ecclesial_function,
                    "ecclesial_function_display": func_labels.get(m.ecclesial_function, m.ecclesial_function),
                    "status": m.status,
                    "status_display": status_labels.get(m.status, m.status),
                    "campus": m.campus_id,
                    "campus_id": str(m.campus_id) if m.campus_id else None,
                    "campus_name": m.campus.name if m.campus else None,
                    "department_id": m.department_id,
                    "department_name": m.department.name if m.department else None,
                    "administered_departments": (
                        [{"id": m.department_id, "name": m.department.name, "code": m.department.code or "", "campus_id": str(m.campus_id), "is_deputy": False}]
                        if m.department else []
                    ),
                    "is_active": m.status not in ("INACTIF", "SUSPENDU"),
                    "is_deputy": False,
                    "avatar": None,
                })

        return Response(results)

    @action(detail=True, methods=["post"], url_path="assign-deputy")
    def assign_deputy(self, request, pk=None):
        """
        Assigne un adjoint au titulaire cible avec permissions granulaires (Sections 7 & 15).
        Autorisé à chaque niveau :
          - Super Super Admin (pour lui-même ou tout responsable)
          - Super Admin d'Église (pour lui-même ou un Admin Dept de son Église)
          - Admin de Département (pour lui-même dans son département)
        Interdit aux adjoints eux-mêmes.
        """
        from apps.departments.models import Department

        actor = request.user
        if _is_deputy_Account(actor):
            raise PermissionDenied("Un adjoint ne peut pas désigner ou gérer d'autres adjoints.")

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

        if titulaire.pk == deputy.pk:
            return Response(
                {"detail": "Un titulaire ne peut pas être son propre adjoint."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ROLE_RANK.get(deputy.role, 0) >= ROLE_RANK.get(titulaire.role, 0):
            raise PermissionDenied(
                "L'adjoint désigné doit avoir un rang technique strictement inférieur à celui du titulaire."
            )

        if eff_role != "SUPER_SUPER_ADMIN" and str(deputy.campus_id) != str(_effective_campus_id(actor)):
            raise PermissionDenied("L'adjoint choisi doit appartenir à la même Église.")

        if titulaire.role != "SUPER_SUPER_ADMIN" and titulaire.campus_id and deputy.campus_id and str(deputy.campus_id) != str(titulaire.campus_id):
            raise PermissionDenied("L'adjoint choisi doit appartenir au même campus que le titulaire.")

        # Révoquer proprement l'ancien adjoint du titulaire lors d'un remplacement
        old_deputies = User.objects.filter(deputy_of=titulaire, is_deputy=True).exclude(pk=deputy.pk)
        for old_dep in old_deputies:
            Department.objects.filter(deputy=old_dep).update(deputy=None)
            old_dep.is_deputy = False
            old_dep.deputy_of = None
            old_dep.delegated_permissions = []
            if old_dep.role == "ADJOINT":
                old_dep.role = "MEMBRE"
            old_dep.save()

        # Configurer l'adjoint dans le même périmètre que son responsable
        deputy.is_deputy = True
        deputy.deputy_of = titulaire
        deputy.delegated_permissions = permissions if isinstance(permissions, list) else []
        if titulaire.role == "SUPER_SUPER_ADMIN":
            deputy.campus = None
        elif titulaire.campus_id and not deputy.campus_id:
            deputy.campus_id = titulaire.campus_id
        if deputy.role == "MEMBRE":
            deputy.role = "ADJOINT"
        deputy.save()

        # Si le titulaire administre un département, synchroniser l'adjoint du département
        if titulaire.role == "ADMIN_DEPT":
            Department.objects.filter(admin=titulaire, is_active=True).update(deputy=deputy)

        RoleAssignment.objects.create(
            user=deputy,
            campus=deputy.campus,
            role=deputy.role,
            ecclesial_function=deputy.ecclesial_function,
            deputy_of=titulaire,
            delegated_permissions=deputy.delegated_permissions,
            appointed_by=actor,
            start_date=timezone.now().date(),
            is_active=True,
            notes=f"Désigné adjoint de {titulaire.get_full_name() or titulaire.username}",
        )
        log_audit_event(
            actor=actor,
            action="DEPUTY_ASSIGNED",
            target_model="User",
            target_id=deputy.id,
            campus=deputy.campus or titulaire.campus,
            description=f"{deputy.username} désigné adjoint de {titulaire.username}",
            metadata={"delegated_permissions": deputy.delegated_permissions},
            request=request,
        )

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
        if _is_deputy_Account(actor):
            raise PermissionDenied("Un adjoint ne peut pas révoquer un autre adjoint.")

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

        RoleAssignment.objects.filter(user=deputy, is_active=True, deputy_of__isnull=False).update(
            is_active=False,
            end_date=timezone.now().date(),
        )
        log_audit_event(
            actor=actor,
            action="DEPUTY_REVOKED",
            target_model="User",
            target_id=deputy.id,
            campus=deputy.campus,
            description=f"Révocation du rôle d'adjoint de {deputy.username}",
            request=request,
        )

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

    @action(detail=True, methods=["get"], url_path="role-history")
    def role_history(self, request, pk=None):
        """Retourne l'historique et les mandats actifs d'un utilisateur."""
        target_user = self.get_object()
        assignments = RoleAssignment.objects.filter(user=target_user).select_related(
            "campus", "department", "brigade", "deputy_of", "appointed_by"
        )
        return Response(RoleAssignmentSerializer(assignments, many=True).data)


class RoleAssignmentViewSet(viewsets.ModelViewSet):
    """
    Gestion et consultation du cumul de mandats et de l'historique des affectations.
    """
    queryset = RoleAssignment.objects.select_related(
        "user", "campus", "department", "brigade", "deputy_of", "appointed_by"
    ).all()
    serializer_class = RoleAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        eff_role = _effective_role(user)
        if eff_role == "SUPER_SUPER_ADMIN":
            campus_id = self.request.query_params.get("campus_id")
            if campus_id and campus_id != "all":
                qs = qs.filter(campus_id=campus_id)
        elif eff_role in ("SUPER_ADMIN", "ADMIN_DEPT"):
            campus_id = _effective_campus_id(user)
            if not campus_id:
                return qs.none()
            qs = qs.filter(campus_id=campus_id)
        else:
            qs = qs.filter(user=user)

        user_id = self.request.query_params.get("user_id")
        if user_id:
            qs = qs.filter(user_id=user_id)
        is_active = self.request.query_params.get("is_active")
        if is_active in ("true", "false"):
            qs = qs.filter(is_active=(is_active == "true"))
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "close_mandate"):
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        actor = self.request.user
        eff_role = _effective_role(actor)
        campus = serializer.validated_data.get("campus")
        if eff_role != "SUPER_SUPER_ADMIN":
            actor_campus_id = _effective_campus_id(actor)
            if campus and str(campus.id) != str(actor_campus_id):
                raise PermissionDenied("Vous ne pouvez créer un mandat que dans votre propre Église.")
            assignment = serializer.save(appointed_by=actor, campus_id=actor_campus_id)
        else:
            assignment = serializer.save(appointed_by=actor)
        log_audit_event(
            actor=actor,
            action="ROLE_ASSIGNMENT_CREATED",
            target_model="RoleAssignment",
            target_id=assignment.id,
            campus=assignment.campus,
            description=f"Mandat {assignment.role} attribué à {assignment.user.username}",
            request=self.request,
        )

    @action(detail=True, methods=["post"], url_path="close")
    def close_mandate(self, request, pk=None):
        assignment = self.get_object()
        assignment.is_active = False
        assignment.end_date = request.data.get("end_date") or timezone.now().date()
        assignment.save(update_fields=["is_active", "end_date"])
        log_audit_event(
            actor=request.user,
            action="ROLE_ASSIGNMENT_CLOSED",
            target_model="RoleAssignment",
            target_id=assignment.id,
            campus=assignment.campus,
            description=f"Clôture du mandat {assignment.role} de {assignment.user.username}",
            request=request,
        )
        return Response(self.get_serializer(assignment).data)



