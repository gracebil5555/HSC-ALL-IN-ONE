from rest_framework import serializers
from .models import (
    Register,
    Voucher,
    VoucherHistory,
    Transaction,
    ExchangeRate,
    AccountingPeriodClose,
)


class ExchangeRateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ExchangeRate
        fields = '__all__'
        read_only_fields = ['created_by']


class AccountingPeriodCloseSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.get_full_name', read_only=True)

    class Meta:
        model = AccountingPeriodClose
        fields = '__all__'
        read_only_fields = ['campus', 'closed_by', 'closed_at']
        validators = []


class TransactionSerializer(serializers.ModelSerializer):
    registered_by_name = serializers.CharField(source='registered_by.get_full_name', read_only=True)
    register_name = serializers.CharField(source='register.name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    campus_currency = serializers.CharField(source='campus.currency', read_only=True)
    register = serializers.PrimaryKeyRelatedField(
        queryset=Register.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['campus', 'registered_by', 'exchange_rate_to_hq', 'amount_in_hq_currency']


class RegisterSerializer(serializers.ModelSerializer):
    campus_currency = serializers.CharField(source='campus.currency', read_only=True)

    class Meta:
        model = Register
        fields = '__all__'


class VoucherHistorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = VoucherHistory
        fields = '__all__'


class VoucherSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    requested_by_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    register_name = serializers.CharField(source='register.name', read_only=True)
    department_name = serializers.CharField(source='register.name', read_only=True)
    campus_currency = serializers.CharField(source='campus.currency', read_only=True)
    first_approver_name = serializers.CharField(source='first_approver.get_full_name', read_only=True)
    second_approver_name = serializers.CharField(source='second_approver.get_full_name', read_only=True)
    history = VoucherHistorySerializer(many=True, read_only=True)
    register = serializers.PrimaryKeyRelatedField(
        queryset=Register.objects.all(),
        required=False,
        allow_null=True,
    )
    voucher_number = serializers.SerializerMethodField()
    beneficiary = serializers.SerializerMethodField()
    purpose = serializers.SerializerMethodField()
    campus_id = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    approved_at = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = '__all__'
        read_only_fields = [
            'status',
            'requester',
            'campus',
            'exchange_rate_to_hq',
            'amount_in_hq_currency',
            'requires_double_validation',
            'first_approver',
            'first_approved_at',
            'second_approver',
            'second_approved_at',
        ]

    def get_voucher_number(self, obj):
        year = obj.created_at.year if obj.created_at else 2026
        return f"PC-{year}-{obj.id:04d}"

    def get_beneficiary(self, obj):
        return obj.title or ""

    def get_purpose(self, obj):
        return obj.description or ""

    def get_campus_id(self, obj):
        return str(obj.campus_id) if obj.campus_id else None

    def get_approved_by_name(self, obj):
        entry = obj.history.filter(new_status='APPROVED').order_by('-changed_at').first()
        if entry and entry.user:
            return entry.user.get_full_name()
        return None

    def get_approved_at(self, obj):
        entry = obj.history.filter(new_status='APPROVED').order_by('-changed_at').first()
        if entry and entry.changed_at:
            return entry.changed_at.strftime('%Y-%m-%d %H:%M')
        return None
