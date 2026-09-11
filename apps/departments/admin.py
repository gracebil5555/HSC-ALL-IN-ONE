from django.contrib import admin
from .models import Department

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'campus')
    list_filter = ('campus',)
    search_fields = ('name',)
