from django.contrib import admin
from .models import AILog

@admin.register(AILog)
class AILogAdmin(admin.ModelAdmin):
    list_display = ('task_type', 'status', 'initiated_by', 'created_at', 'campus')
    list_filter = ('task_type', 'status', 'campus')
    search_fields = ('initiated_by__username',)
