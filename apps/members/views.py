from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone
from apps.core.models import log_audit_event
from apps.users.permissions import (
    RoleFilterMixin,
    IsSuperSuperAdmin,
    IsSuperAdmin,
    IsAdjointOrAbove,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
    _effective_user,
    _get_user_department_codes,
)
from apps.assimilation.models import AssimilationProfile
from .models import (
    Brigade,
    Member,
    Attendance,
    PastoralAlert,
    EcclesialFunctionCatalog,
    MemberStatusCatalog,
    MemberTransferRequest,
)
from .serializers import (
    BrigadeSerializer,
    MemberSerializer,
    AttendanceSerializer,
    PastoralAlertSerializer,
    EcclesialFunctionCatalogSerializer,
    MemberStatusCatalogSerializer,
    MemberTransferRequestSerializer,
    FRONT_TO_STAGE,
)

ISOLATED_NON_MEMBER_DEPTS = {"FINANCES", "PATRIMOINE"}
CAMPUS_WIDE_PASTORAL_DEPTS = {"ACCUEIL", "SECRETARIAT", "SOCIAL", "BRIGADE", "GDC"}


def _get_user_department_ids(user):
    eff_user = _effective_user(user)
    dept_ids = set()
    for target in {user, eff_user}:
        if not target:
            continue
        if hasattr(target, "administered_departments"):
            dept_ids.update(target.administered_departments.filter(is_active=True).values_list("id", flat=True))
        if hasattr(target, "deputy_departments"):
            dept_ids.update(target.deputy_departments.filter(is_active=True).values_list("id", flat=True))
    return dept_ids


class CanAccessMembersScope(BasePermission):
    """
    Section 20 : Empêche les ADMIN_DEPT rattachés exclusivement à FINANCES ou PATRIMOINE
    d'accéder aux membres, brigades, présences et alertes pastorales.
    """
    message = "Accès refusé : votre département (Finances / Patrimoine) n'a pas accès aux données des membres."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if codes and codes.issubset(ISOLATED_NON_MEMBER_DEPTS):
                return False
        return True


class BrigadeViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des Brigades et GDC d'une Église (Sections 6, 11, 16).
    Strictement isolée par campus et réservée aux rôles pastoraux / accueil / brigades.
    """
    queryset = Brigade.objects.select_related("campus", "leader").all()
    serializer_class = BrigadeSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction, CanAccessMembersScope]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if not codes.intersection(CAMPUS_WIDE_PASTORAL_DEPTS):
                return qs.none()
        return qs


class MemberViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des membres et du suivi pastoral (Sections 16, 20, 22, 25).
    - Strictement isolée par Église / campus.
    - Pour un Admin de Département (hors Accueil/Secrétariat/Social/Brigade), filtre
      automatiquement par ses départements administrés.
    """
    queryset = Member.objects.select_related(
        "campus", "brigade", "department", "assimilation_profile"
    ).all().order_by('-created_at')
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction, CanAccessMembersScope]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if not codes.intersection(CAMPUS_WIDE_PASTORAL_DEPTS):
                dept_ids = _get_user_department_ids(user)
                if not dept_ids:
                    return qs.none()
                qs = qs.filter(department_id__in=dept_ids)

        department_id = self.request.query_params.get("department_id")
        if department_id:
            qs = qs.filter(department_id=department_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if not codes.intersection(CAMPUS_WIDE_PASTORAL_DEPTS):
                dept_ids = _get_user_department_ids(user)
                req_dept = serializer.validated_data.get("department")
                if req_dept and req_dept.id not in dept_ids:
                    raise PermissionDenied("Vous ne pouvez créer un membre que dans votre propre département.")
                if not req_dept and len(dept_ids) == 1:
                    serializer.validated_data["department_id"] = next(iter(dept_ids))
        super().perform_create(serializer)
        member = serializer.instance
        if member:
            AssimilationProfile.objects.get_or_create(
                member=member,
                defaults={"campus": member.campus, "current_stage": "CONTACT"},
            )
            from apps.communications.services import trigger_welcome_message_for_member
            trigger_welcome_message_for_member(member, created_by=user)

    @action(detail=True, methods=["patch", "post"], url_path="assimilation-stage")
    def assimilation_stage(self, request, pk=None):
        member = self.get_object()
        raw_stage = request.data.get("stage") or request.data.get("assimilation_stage") or request.data.get("current_stage")
        if not raw_stage:
            raise ValidationError({"stage": "Le paramètre 'stage' est requis."})
        valid_backend = {"CONTACT", "M1", "M2", "BAPTISM", "INTEGRATED"}
        backend_stage = FRONT_TO_STAGE.get(raw_stage, raw_stage if raw_stage in valid_backend else None)
        if not backend_stage:
            raise ValidationError({"stage": f"Étape d'assimilation invalide : {raw_stage}"})

        AssimilationProfile.objects.update_or_create(
            member=member,
            defaults={"current_stage": backend_stage, "campus": member.campus},
        )
        member.refresh_from_db()
        return Response(self.get_serializer(member).data, status=status.HTTP_200_OK)


class AttendanceViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("campus", "member", "scanned_by").all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction, CanAccessMembersScope]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if not codes.intersection(CAMPUS_WIDE_PASTORAL_DEPTS):
                dept_ids = _get_user_department_ids(user)
                return qs.filter(member__department_id__in=dept_ids) if dept_ids else qs.none()
        return qs


class PastoralAlertViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = PastoralAlert.objects.select_related("campus", "member", "assigned_pastor").all().order_by('-created_at')
    serializer_class = PastoralAlertSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction, CanAccessMembersScope]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if _effective_role(user) == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if not codes.intersection(CAMPUS_WIDE_PASTORAL_DEPTS):
                dept_ids = _get_user_department_ids(user)
                return qs.filter(member__department_id__in=dept_ids) if dept_ids else qs.none()
        return qs


class EcclesialFunctionCatalogViewSet(viewsets.ModelViewSet):
    """
    Catalogue configurable des fonctions ecclésiales (Sections 22, 25, 26).
    - Lecture pour tout utilisateur authentifié.
    - Écriture réservée au Super Super Admin.
    """
    queryset = EcclesialFunctionCatalog.objects.all()
    serializer_class = EcclesialFunctionCatalogSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("active_only") == "true":
            qs = qs.filter(is_active=True)
        return qs


class MemberStatusCatalogViewSet(viewsets.ModelViewSet):
    """
    Catalogue configurable des statuts de membres (Sections 22, 25, 26).
    - Lecture pour tout utilisateur authentifié.
    - Écriture réservée au Super Super Admin.
    """
    queryset = MemberStatusCatalog.objects.all()
    serializer_class = MemberStatusCatalogSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("active_only") == "true":
            qs = qs.filter(is_active=True)
        return qs


class MemberTransferRequestViewSet(viewsets.ModelViewSet):
    """
    Workflow de transfert inter-églises des membres (conservation de l'historique spirituel et d'assimilation).
    """
    queryset = MemberTransferRequest.objects.select_related(
        "member", "from_campus", "to_campus", "requested_by", "reviewed_by"
    ).all()
    serializer_class = MemberTransferRequestSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, CanAccessMembersScope]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if not campus_id:
                return qs.none()
            from django.db.models import Q
            qs = qs.filter(Q(from_campus_id=campus_id) | Q(to_campus_id=campus_id))
        return qs

    def perform_create(self, serializer):
        member = serializer.validated_data["member"]
        to_campus = serializer.validated_data["to_campus"]
        from_campus = member.campus
        if from_campus.id == to_campus.id:
            raise ValidationError({"to_campus": "Le campus de destination doit être différent du campus actuel."})
        user = self.request.user
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            actor_campus_id = _effective_campus_id(user)
            if str(from_campus.id) != str(actor_campus_id):
                raise PermissionDenied("Vous ne pouvez initier un transfert que pour un membre de votre propre Église.")
        req = serializer.save(from_campus=from_campus, requested_by=user, status="PENDING")
        log_audit_event(
            actor=user,
            action="MEMBER_TRANSFER_REQUESTED",
            target_model="MemberTransferRequest",
            target_id=req.id,
            campus=from_campus,
            description=f"Demande de transfert de {member} : {from_campus.name} -> {to_campus.name}",
            request=self.request,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        user = request.user
        eff_role = _effective_role(user)
        if eff_role not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Seul un Super Admin d'Église ou le Super Super Admin peut approuver un transfert.")

        req = self.get_object()
        if req.status != "PENDING":
            return Response({"detail": "Seules les demandes en attente peuvent être approuvées."}, status=status.HTTP_400_BAD_REQUEST)

        if eff_role != "SUPER_SUPER_ADMIN":
            actor_campus_id = _effective_campus_id(user)
            if str(req.to_campus_id) != str(actor_campus_id) and str(req.from_campus_id) != str(actor_campus_id):
                raise PermissionDenied("Vous n'êtes pas autorisé à valider ce transfert.")

        with transaction.atomic():
            member = req.member
            member.campus = req.to_campus
            member.brigade = None
            member.department = None
            member.save(update_fields=["campus", "brigade", "department", "updated_at"])

            if req.preserve_assimilation and hasattr(member, "assimilation_profile"):
                profile = member.assimilation_profile
                profile.campus = req.to_campus
                profile.save(update_fields=["campus"])

            req.status = "APPROVED"
            req.reviewed_by = user
            req.reviewed_at = timezone.now()
            req.review_notes = request.data.get("review_notes", "")
            req.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes"])

            log_audit_event(
                actor=user,
                action="MEMBER_TRANSFER_APPROVED",
                target_model="MemberTransferRequest",
                target_id=req.id,
                campus=req.to_campus,
                description=f"Transfert approuvé pour {member} : {req.from_campus.name} -> {req.to_campus.name}",
                request=request,
            )

        return Response(self.get_serializer(req).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        user = request.user
        if _effective_role(user) not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Seul un Super Admin ou Super Super Admin peut rejeter un transfert.")
        req = self.get_object()
        if req.status != "PENDING":
            return Response({"detail": "Seules les demandes en attente peuvent être rejetées."}, status=status.HTTP_400_BAD_REQUEST)

        req.status = "REJECTED"
        req.reviewed_by = user
        req.reviewed_at = timezone.now()
        req.review_notes = request.data.get("review_notes", "")
        req.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_notes"])

        log_audit_event(
            actor=user,
            action="MEMBER_TRANSFER_REJECTED",
            target_model="MemberTransferRequest",
            target_id=req.id,
            campus=req.from_campus,
            description=f"Transfert rejeté pour {req.member}",
            request=request,
        )
        return Response(self.get_serializer(req).data)

