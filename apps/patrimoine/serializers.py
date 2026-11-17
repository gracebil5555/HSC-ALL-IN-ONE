from rest_framework import serializers
from .models import Asset, AssetMovement, ConsumableItem, StockMovement


class AssetMovementSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_code = serializers.CharField(source='asset.asset_code', read_only=True)
    responsible_name = serializers.CharField(source='responsible.get_full_name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    observed_condition_display = serializers.CharField(source='get_observed_condition_display', read_only=True)

    class Meta:
        model = AssetMovement
        fields = '__all__'
        read_only_fields = ['campus']


class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    department_name = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    estimated_value = serializers.SerializerMethodField()
    accumulated_depreciation = serializers.SerializerMethodField()
    net_book_value = serializers.SerializerMethodField()
    effective_depreciation_rate = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    movements = AssetMovementSerializer(many=True, read_only=True)

    class Meta:
        model = Asset
        fields = '__all__'
        extra_kwargs = {
            'campus': {'required': False},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not data.get("asset_code"):
            data["asset_code"] = f"HSC-ACT-{instance.id:04d}"
        return data

    def get_room(self, obj):
        return obj.location or obj.description or "Sanctuaire Principal"

    def get_department_name(self, obj):
        if obj.department:
            return obj.department.name
        return "Patrimoine & Logistique"

    def get_estimated_value(self, obj):
        return float(obj.net_book_value or obj.purchase_price or 0)

    def get_accumulated_depreciation(self, obj):
        return float(obj.accumulated_depreciation)

    def get_net_book_value(self, obj):
        return float(obj.net_book_value)

    def get_effective_depreciation_rate(self, obj):
        return float(obj.effective_depreciation_rate)

    def get_notes(self, obj):
        return obj.description or ""

    def get_qr_code_url(self, obj):
        return f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={obj.qr_code}"


class ConsumableItemSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    unit = serializers.CharField(source='unit_measure', read_only=True)
    category = serializers.SerializerMethodField()

    class Meta:
        model = ConsumableItem
        fields = '__all__'

    def get_category(self, obj):
        return "Intendance"


class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    stock_item_name = serializers.CharField(source='item.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)
    requested_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['campus', 'performed_by']
