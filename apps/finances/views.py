from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from .models import Register, Voucher, VoucherHistory, Transaction
from .serializers import RegisterSerializer, VoucherSerializer, TransactionSerializer

class RegisterViewSet(viewsets.ModelViewSet):
    queryset = Register.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [AllowAny]

class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all().order_by('-created_at')
    serializer_class = VoucherSerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        voucher = self.get_object()
        if voucher.status != 'PENDING':
            return Response({'detail': 'Seules les pièces en attente peuvent être approuvées.'}, status=status.HTTP_400_BAD_REQUEST)
        
        note = request.data.get('note', 'Validé par le Pasteur / Administrateur')
        user = request.user if request.user.is_authenticated else None
        
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
        voucher = self.get_object()
        if voucher.status != 'APPROVED':
            return Response({'detail': 'Seules les pièces approuvées peuvent être décaissées.'}, status=status.HTTP_400_BAD_REQUEST)
        
        note = request.data.get('note', 'Fonds décaissés physiquement contre émargement')
        user = request.user if request.user.is_authenticated else None
        
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
            
            # Create transaction entry
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
            
            # Update register balance
            voucher.register.current_balance -= voucher.amount
            voucher.register.save()
            
        return Response(self.get_serializer(voucher).data)
