from rest_framework import serializers
from .models import Campus

class CampusSerializer(serializers.ModelSerializer):
    lead_pastor_name = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    campus_type_display = serializers.CharField(source='get_campus_type_display', read_only=True)
    sub_extensions_count = serializers.IntegerField(source='sub_extensions.count', read_only=True)
    member_count = serializers.IntegerField(source='members_member_related.count', read_only=True)

    class Meta:
        model = Campus
        fields = '__all__'

    def get_lead_pastor_name(self, obj):
        if obj.lead_pastor:
            title = f"{obj.lead_pastor.title} " if obj.lead_pastor.title else ""
            return f"{title}{obj.lead_pastor.get_full_name()}".strip()
        return "Non assigné"


