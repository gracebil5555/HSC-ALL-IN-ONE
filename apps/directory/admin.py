from django.contrib import admin
from .models import BusinessProfile

@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'member', 'category', 'is_public', 'campus')
    list_filter = ('category', 'is_public', 'campus')
    search_fields = ('business_name', 'member__first_name', 'member__last_name')
