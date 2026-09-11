from django.contrib import admin
from .models import AssimilationProfile, ClassSession, BaptismInterview

@admin.register(AssimilationProfile)
class AssimilationProfileAdmin(admin.ModelAdmin):
    list_display = ('member', 'current_stage', 'started_at')
    list_filter = ('current_stage',)
    search_fields = ('member__first_name', 'member__last_name')

@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ('class_type', 'date', 'teacher', 'campus')
    list_filter = ('class_type', 'date', 'campus')

@admin.register(BaptismInterview)
class BaptismInterviewAdmin(admin.ModelAdmin):
    list_display = ('member', 'pastor', 'interview_date', 'status', 'campus')
    list_filter = ('status', 'campus')
