from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from apps.core.models import log_audit_event
from apps.users.permissions import (
    RoleFilterMixin,
    IsSuperSuperAdmin,
    IsSuperAdmin,
    IsAdminDeptOfCampus,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
    _get_user_department_codes,
    _has_granular_permission,
)
from .models import (
    Register,
    Voucher,
    VoucherHistory,
    Transaction,
    ExchangeRate,
    AccountingPeriodClose,
)
from .serializers import (
    RegisterSerializer,
    VoucherSerializer,
    TransactionSerializer,
    ExchangeRateSerializer,
    AccountingPeriodCloseSerializer,
)


def _ensure_finance_permission(user, write=False):
    eff_role = _effective_role(user)
    if eff_role in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
        return
    if eff_role == "ADMIN_DEPT":
        codes = _get_user_department_codes(user)
        if "FINANCES" not in codes:
            raise PermissionDenied(
                "Accès refusé : Seul l'Admin Finances ou le Super Admin de l'Église peut accéder ou modifier les données financières."
            )
        return
    raise PermissionDenied("Accès non autorisé au module Finances.")


def _ensure_period_open(campus_id, target_date=None):
    ref_date = target_date or timezone.now().date()
    if AccountingPeriodClose.is_date_closed(campus_id, ref_date):
        raise PermissionDenied(
            f"Période comptable {ref_date.month:02d}/{ref_date.year} clôturée et verrouillée pour ce campus."
        )


class ExchangeRateViewSet(viewsets.ModelViewSet):
    """
    Gestion des taux de change vers la devise du Siège Mondial (XAF).
    Lecture : tout utilisateur authentifié.
    Écriture : Super Super Admin uniquement.
    """
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        rate = serializer.save(created_by=self.request.user)
        log_audit_event(
            actor=self.request.user,
            action="EXCHANGE_RATE_CREATED",
            target_model="ExchangeRate",
            target_id=rate.id,
            description=f"Taux {rate.from_currency}->{rate.to_currency} = {rate.rate}",
            request=self.request,
        )


class AccountingPeriodCloseViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Clôture mensuelle verrouillée par campus.
    - Consultation (list / retrieve) : Super Super Admin, Super Admin, ou Admin Dept Finances.
    - Clôture (create / close_period) : Super Admin du campus ou Super Super Admin.
    - Réouverture (reopen) : Super Super Admin uniquement.
    """
    queryset = AccountingPeriodClose.objects.select_related("campus", "closed_by").all()
    serializer_class = AccountingPeriodCloseSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    allowed_department_codes = ["FINANCES"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsAuthenticated(), IsAdminDeptOfCampus()]
        if self.action == "reopen":
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        return [IsAuthenticated(), IsSuperAdmin()]

    def perform_create(self, serializer):
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
        else:
            raw_campus = self.request.data.get("campus") or self.request.data.get("campus_id")
            campus_id = int(raw_campus) if raw_campus and str(raw_campus).isdigit() else _effective_campus_id(user)
        if not campus_id:
            raise PermissionDenied("Aucun campus valide pour clôturer la période.")

        year = int(serializer.validated_data["year"])
        month = int(serializer.validated_data["month"])
        if month < 1 or month > 12:
            raise ValidationError({"month": "Le mois doit être compris entre 1 et 12."})

        obj, created = AccountingPeriodClose.objects.update_or_create(
            campus_id=campus_id,
            year=year,
            month=month,
            defaults={
                "is_closed": True,
                "closed_by": user,
                "notes": serializer.validated_data.get("notes", ""),
            },
        )
        serializer.instance = obj
        log_audit_event(
            actor=user,
            action="FINANCE_PERIOD_CLOSED",
            target_model="AccountingPeriodClose",
            target_id=obj.id,
            campus=obj.campus,
            description=f"Clôture comptable {month:02d}/{year} pour {obj.campus.name}",
            request=self.request,
        )

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        if _effective_role(request.user) != "SUPER_SUPER_ADMIN":
            raise PermissionDenied("Seul le Super Super Admin peut rouvrir une période clôturée.")
        period = self.get_object()
        period.is_closed = False
        period.save(update_fields=["is_closed"])
        log_audit_event(
            actor=request.user,
            action="FINANCE_PERIOD_REOPENED",
            target_model="AccountingPeriodClose",
            target_id=period.id,
            campus=period.campus,
            description=f"Réouverture comptable {period.month:02d}/{period.year}",
            request=request,
        )
        return Response(self.get_serializer(period).data)


class RegisterViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = Register.objects.select_related("campus").all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["FINANCES"]


class TransactionViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related("campus", "register", "registered_by").all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["FINANCES"]

    def get_queryset(self):
        qs = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        entry_type = self.request.query_params.get("entry_type")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if entry_type in ("CREDIT", "DEBIT"):
            qs = qs.filter(entry_type=entry_type)
        return qs

    def perform_create(self, serializer):
        from apps.campuses.models import Campus

        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
        else:
            raw_campus = self.request.data.get("campus") or self.request.data.get("campus_id")
            campus_id = int(raw_campus) if raw_campus and str(raw_campus).isdigit() else None
            if not campus_id:
                reg = serializer.validated_data.get("register")
                campus_id = reg.campus_id if reg else Campus.objects.order_by("id").values_list("id", flat=True).first()
        if not campus_id:
            raise PermissionDenied("Aucun campus valide trouvé pour enregistrer la transaction.")

        _ensure_period_open(int(campus_id))

        amount = serializer.validated_data.get("amount")
        if amount is None or amount <= 0:
            raise ValidationError({"amount": "Le montant doit être strictement positif."})

        with transaction.atomic():
            register = serializer.validated_data.get("register")
            if not register or register.campus_id != int(campus_id):
                register, _ = Register.objects.select_for_update().get_or_create(
                    campus_id=campus_id,
                    register_type="CASH",
                    defaults={"name": "Caisse Principale", "current_balance": 0},
                )
            else:
                register = Register.objects.select_for_update().get(pk=register.pk)

            reference = serializer.validated_data.get("reference") or f"ECR-{timezone.now().strftime('%Y%m%d%H%M%S')}"
            currency = serializer.validated_data.get("currency") or register.campus.currency or "XAF"
            tx = serializer.save(
                campus_id=register.campus_id,
                register=register,
                registered_by=user,
                reference=reference,
                currency=currency,
            )

            if tx.entry_type == "CREDIT":
                register.current_balance += tx.amount
            else:
                register.current_balance -= tx.amount
            register.save(update_fields=["current_balance", "updated_at"])

            log_audit_event(
                actor=user,
                action="FINANCE_TRANSACTION_CREATED",
                target_model="Transaction",
                target_id=tx.id,
                campus=register.campus,
                description=f"{tx.entry_type} {tx.amount} {tx.currency} ({tx.amount_in_hq_currency} XAF) - {tx.category}",
                metadata={"reference": tx.reference, "currency": tx.currency, "amount_hq": str(tx.amount_in_hq_currency)},
                request=self.request,
            )

    def perform_update(self, serializer):
        raise PermissionDenied("Les écritures comptables passées sont immuables et ne peuvent pas être modifiées.")

    def perform_destroy(self, instance):
        raise PermissionDenied("Les écritures comptables passées sont immuables et ne peuvent pas être supprimées.")


class VoucherViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = Voucher.objects.select_related(
        "campus", "register", "requester", "first_approver", "second_approver"
    ).all().order_by('-created_at')
    serializer_class = VoucherSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            if "FINANCES" not in codes:
                qs = qs.filter(requester=user)
        return qs

    def perform_create(self, serializer):
        from apps.campuses.models import Campus

        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
        else:
            raw_campus = self.request.data.get("campus") or self.request.data.get("campus_id")
            campus_id = int(raw_campus) if raw_campus and str(raw_campus).isdigit() else None
            if not campus_id:
                campus_id = Campus.objects.order_by("id").values_list("id", flat=True).first()
        if not campus_id:
            raise PermissionDenied("Aucun campus valide trouvé pour créer la pièce de caisse.")

        _ensure_period_open(int(campus_id))

        register = serializer.validated_data.get("register")
        if not register or register.campus_id != int(campus_id):
            register, _ = Register.objects.get_or_create(
                campus_id=campus_id,
                register_type="CASH",
                defaults={"name": "Caisse Principale", "current_balance": 0},
            )
        campus_obj = Campus.objects.filter(pk=campus_id).first()
        currency = serializer.validated_data.get("currency") or (campus_obj.currency if campus_obj else "XAF")
        serializer.save(
            campus_id=campus_id,
            register=register,
            requester=user,
            currency=currency,
        )

    def perform_update(self, serializer):
        _ensure_finance_permission(self.request.user, write=True)
        instance = self.get_object()
        _ensure_period_open(instance.campus_id)
        updated = serializer.save()
        log_audit_event(
            actor=self.request.user,
            action="FINANCE_VOUCHER_UPDATED",
            target_model="Voucher",
            target_id=updated.id,
            campus=updated.campus,
            description=f"Modification pièce #{updated.id} ({updated.amount} {updated.currency})",
            request=self.request,
        )

    def perform_destroy(self, instance):
        _ensure_finance_permission(self.request.user, write=True)
        _ensure_period_open(instance.campus_id)
        vid = instance.id
        campus = instance.campus
        title = instance.title
        super().perform_destroy(instance)
        log_audit_event(
            actor=self.request.user,
            action="FINANCE_VOUCHER_DELETED",
            target_model="Voucher",
            target_id=vid,
            campus=campus,
            description=f"Suppression pièce #{vid} ({title})",
            request=self.request,
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Validation pastorale.
        Si requires_double_validation est True (>= plafond HQ), exige 2 approbateurs distincts :
          1er appel : PENDING -> PENDING_SECOND_APPROVAL
          2e appel (par un autre validateur habilité) : PENDING_SECOND_APPROVAL -> APPROVED
        """
        user = request.user
        if _effective_role(user) not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Seul le Super Admin (Pasteur dirigeant) ou son adjoint habilité peut valider une pièce de caisse.")
        if not _has_granular_permission(user, "valider"):
            raise PermissionDenied("Votre délégation d'adjoint n'inclut pas la permission 'valider'.")

        voucher = self.get_object()
        _ensure_period_open(voucher.campus_id)

        if voucher.status not in ('PENDING', 'PENDING_SECOND_APPROVAL'):
            return Response(
                {'detail': 'Seules les pièces en attente peuvent être approuvées.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get('note', 'Validé par le Pasteur / Super Admin')

        with transaction.atomic():
            old_status = voucher.status
            if voucher.requires_double_validation:
                if voucher.status == 'PENDING':
                    voucher.status = 'PENDING_SECOND_APPROVAL'
                    voucher.first_approver = user
                    voucher.first_approved_at = timezone.now()
                    voucher.save()
                    VoucherHistory.objects.create(
                        voucher=voucher,
                        user=user,
                        old_status=old_status,
                        new_status='PENDING_SECOND_APPROVAL',
                        comments=f"[1ère validation] {note}",
                    )
                    log_audit_event(
                        actor=user,
                        action="FINANCE_VOUCHER_FIRST_APPROVED",
                        target_model="Voucher",
                        target_id=voucher.id,
                        campus=voucher.campus,
                        description=f"1ère validation pièce #{voucher.id} ({voucher.amount} {voucher.currency})",
                        request=request,
                    )
                    return Response(self.get_serializer(voucher).data)
                else:
                    if voucher.first_approver_id == user.id:
                        raise PermissionDenied(
                            "Double validation requise : le second approbateur doit être différent du premier."
                        )
                    voucher.status = 'APPROVED'
                    voucher.second_approver = user
                    voucher.second_approved_at = timezone.now()
                    voucher.save()
                    VoucherHistory.objects.create(
                        voucher=voucher,
                        user=user,
                        old_status=old_status,
                        new_status='APPROVED',
                        comments=f"[2e validation] {note}",
                    )
            else:
                voucher.status = 'APPROVED'
                voucher.first_approver = user
                voucher.first_approved_at = timezone.now()
                voucher.save()
                VoucherHistory.objects.create(
                    voucher=voucher,
                    user=user,
                    old_status=old_status,
                    new_status='APPROVED',
                    comments=note,
                )

            log_audit_event(
                actor=user,
                action="FINANCE_VOUCHER_APPROVED",
                target_model="Voucher",
                target_id=voucher.id,
                campus=voucher.campus,
                description=f"Approbation finale pièce #{voucher.id} ({voucher.amount} {voucher.currency})",
                request=request,
            )

        return Response(self.get_serializer(voucher).data)

    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        """Décaissement réservé au Super Admin ou à l'Admin Finances du campus."""
        user = request.user
        _ensure_finance_permission(user, write=True)
        if not _has_granular_permission(user, "valider"):
            raise PermissionDenied("Votre délégation d'adjoint n'inclut pas la permission 'valider' pour décaisser.")

        voucher = self.get_object()
        _ensure_period_open(voucher.campus_id)

        if voucher.status != 'APPROVED':
            return Response(
                {'detail': 'Seules les pièces approuvées peuvent être décaissées.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get('note', 'Fonds décaissés physiquement contre émargement')

        with transaction.atomic():
            old_status = voucher.status
            voucher.status = 'DISBURSED'
            voucher.save()

            VoucherHistory.objects.create(
                voucher=voucher,
                user=user,
                old_status=old_status,
                new_status='DISBURSED',
                comments=note,
            )

            Transaction.objects.create(
                register=voucher.register,
                campus=voucher.campus,
                reference=f"DEC-{voucher.id}",
                entry_type='DEBIT',
                category='DECAISSEMENT_PIECE',
                amount=voucher.amount,
                currency=voucher.currency,
                description=f"Décaissement pièce {voucher.title}",
                registered_by=user,
                voucher=voucher,
            )

            voucher.register.current_balance -= voucher.amount
            voucher.register.save()

            log_audit_event(
                actor=user,
                action="FINANCE_VOUCHER_DISBURSED",
                target_model="Voucher",
                target_id=voucher.id,
                campus=voucher.campus,
                description=f"Décaissement pièce #{voucher.id} ({voucher.amount} {voucher.currency})",
                request=request,
            )

        return Response(self.get_serializer(voucher).data)
