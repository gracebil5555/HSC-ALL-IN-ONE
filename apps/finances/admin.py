from django.contrib import admin
from .models import Register, Voucher, VoucherHistory

@admin.register(Register)
class RegisterAdmin(admin.ModelAdmin):
    list_display = ('name', 'register_type', 'current_balance', 'campus')
    list_filter = ('register_type', 'campus')
    search_fields = ('name',)

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'requester', 'status', 'campus')
    list_filter = ('status', 'campus')
    search_fields = ('title',)

@admin.register(VoucherHistory)
class VoucherHistoryAdmin(admin.ModelAdmin):
    list_display = ('voucher', 'old_status', 'new_status', 'user', 'changed_at')
    list_filter = ('old_status', 'new_status', 'changed_at')

from .models import Transaction
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference', 'entry_type', 'amount', 'category', 'register')
    list_filter = ('entry_type', 'category')
    search_fields = ('reference', 'description')
