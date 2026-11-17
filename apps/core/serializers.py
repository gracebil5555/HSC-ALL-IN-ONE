from rest_framework import serializers
from .models import SystemAuditLog


class SystemAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    campus_name = serializers.CharField(source='campus.name', read_only=True)

    class Meta:
        model = SystemAuditLog
        fields = [
            'id',
            'actor',
            'actor_username',
            'actor_name',
            'campus',
            'campus_name',
            'action',
            'target_model',
            'target_id',
            'description',
            'metadata',
            'ip_address',
            'created_at',
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return obj.actor_username or "Système"
