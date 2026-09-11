from django.contrib import admin
from .models import Asset, ConsumableItem, StockMovement

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'qr_code', 'condition', 'campus')
    list_filter = ('condition', 'campus')
    search_fields = ('name', 'qr_code')

@admin.register(ConsumableItem)
class ConsumableItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity_in_stock', 'alert_threshold', 'campus')
    list_filter = ('campus',)
    search_fields = ('name',)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'movement_type', 'quantity', 'created_at', 'campus')
    list_filter = ('movement_type', 'created_at', 'campus')
