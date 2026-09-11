from django.contrib import admin
from .models import Campus

@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ('name', 'campus_type', 'city', 'lead_pastor', 'is_active')
    list_filter = ('campus_type', 'is_active', 'city')
    search_fields = ('name', 'city')
