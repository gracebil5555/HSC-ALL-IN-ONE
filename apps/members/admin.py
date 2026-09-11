from django.contrib import admin
from .models import Brigade, Member, Attendance, PastoralAlert

@admin.register(Brigade)
class BrigadeAdmin(admin.ModelAdmin):
    list_display = ('name', 'leader', 'campus', 'is_active')
    list_filter = ('campus', 'is_active')
    search_fields = ('name',)

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'phone', 'brigade', 'status', 'campus')
    list_filter = ('status', 'campus')
    search_fields = ('first_name', 'last_name', 'phone')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('member', 'date', 'event_type', 'is_present', 'campus')
    list_filter = ('date', 'event_type', 'is_present', 'campus')

@admin.register(PastoralAlert)
class PastoralAlertAdmin(admin.ModelAdmin):
    list_display = ('member', 'title', 'status', 'assigned_pastor', 'campus')
    list_filter = ('status', 'campus')
    search_fields = ('member__first_name', 'member__last_name', 'title')
