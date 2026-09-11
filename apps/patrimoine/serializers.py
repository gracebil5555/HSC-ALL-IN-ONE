from rest_framework import serializers
from .models import Asset, ConsumableItem, StockMovement

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)

    class Meta:
        model = Asset
        fields = '__all__'


class ConsumableItemSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)

    class Meta:
        model = ConsumableItem
        fields = '__all__'


class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
