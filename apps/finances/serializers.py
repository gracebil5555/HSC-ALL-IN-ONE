from rest_framework import serializers
from .models import Register, Voucher, VoucherHistory, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    registered_by_name = serializers.CharField(source='registered_by.get_full_name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
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
    register_name = serializers.CharField(source='register.name', read_only=True)
    history = VoucherHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Voucher
        fields = '__all__'
        read_only_fields = ['status'] # Status should be updated via custom actions
