from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from apps.users.permissions import (
    RoleFilterMixin,
    IsSuperAdminOfCampus,
    IsAdminDeptOfCampus,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
    _get_user_department_codes,
    _has_granular_permission,
)
from .models import Register, Voucher, VoucherHistory, Transaction
from .serializers import RegisterSerializer, VoucherSerializer, TransactionSerializer


def _ensure_finance_permission(user, write=False):
    """
    Section 20 :
    - Un Admin Finance ne voit pas les données d'un autre département.
    - Un Admin Patrimoine (ou autre département hors Finance) ne peut pas modifier les finances.
    """
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


class VoucherViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Gestion des pièces de caisse (Section 12, 15, 16, 20) :
      - Isolation stricte par Église / campus.
      - Émission (create) : Super Admin ou Admin Finances (ou Admin de département pour demande de fonds).
      - Modification / Suppression : Super Admin ou Admin Finances uniquement (un Admin Patrimoine ne peut pas modifier les finances).
      - Validation pastorale (approve) : réservée au Super Admin de l'Église (ou Super Super Admin / adjoint avec permission 'valider').
      - Décaissement (disburse) : Super Admin ou Admin Finances du campus.
    """
    queryset = Voucher.objects.select_related("campus", "register", "requester").all().order_by('-created_at')
    serializer_class = VoucherSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        eff_role = _effective_role(user)
        if eff_role == "ADMIN_DEPT":
            codes = _get_user_department_codes(user)
            # Un Admin de département autre que Finances ne voit que ses propres demandes
            if "FINANCES" not in codes:
                qs = qs.filter(requester=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        eff_role = _effective_role(user)
        campus_id = _effective_campus_id(user) if eff_role != "SUPER_SUPER_ADMIN" else (
            serializer.validated_data.get("campus").id if serializer.validated_data.get("campus") else 1
        )
        # Auto-résolution de la caisse du campus si non fournie ou d'un autre campus
        register = serializer.validated_data.get("register")
        if not register or (campus_id and register.campus_id != int(campus_id)):
            register, _ = Register.objects.get_or_create(
                campus_id=campus_id,
                register_type="CASH",
                defaults={"name": "Caisse Principale", "current_balance": 0},
            )
        serializer.save(
            campus_id=campus_id,
            register=register,
            requester=user,
        )

    def perform_update(self, serializer):
        _ensure_finance_permission(self.request.user, write=True)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        _ensure_finance_permission(self.request.user, write=True)
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Validation pastorale strictement réservée au Super Admin d'Église / Super Super Admin (ou adjoint avec 'valider')."""
        user = request.user
        if _effective_role(user) not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
            raise PermissionDenied("Seul le Super Admin (Pasteur dirigeant) ou son adjoint habilité peut valider une pièce de caisse.")
        if not _has_granular_permission(user, "valider"):
            raise PermissionDenied("Votre délégation d'adjoint n'inclut pas la permission 'valider'.")

        voucher = self.get_object()
        if voucher.status != 'PENDING':
            return Response({'detail': 'Seules les pièces en attente peuvent être approuvées.'}, status=status.HTTP_400_BAD_REQUEST)

        note = request.data.get('note', 'Validé par le Pasteur / Super Admin')

        with transaction.atomic():
            old_status = voucher.status
            voucher.status = 'APPROVED'
            voucher.save()

            VoucherHistory.objects.create(
                voucher=voucher,
                user=user,
                old_status=old_status,
                new_status='APPROVED',
                comments=note
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
        if voucher.status != 'APPROVED':
            return Response({'detail': 'Seules les pièces approuvées peuvent être décaissées.'}, status=status.HTTP_400_BAD_REQUEST)

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
                comments=note
            )

            Transaction.objects.create(
                register=voucher.register,
                campus=voucher.campus,
                reference=f"DEC-{voucher.id}",
                entry_type='DEBIT',
                category='DECAISSEMENT_PIECE',
                amount=voucher.amount,
                description=f"Décaissement pièce {voucher.title}",
                registered_by=user,
                voucher=voucher
            )

            voucher.register.current_balance -= voucher.amount
            voucher.register.save()

        return Response(self.get_serializer(voucher).data)

