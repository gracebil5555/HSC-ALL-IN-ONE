from rest_framework import serializers
from .models import Campus

class CampusSerializer(serializers.ModelSerializer):
    lead_pastor_name = serializers.CharField(source='lead_pastor.get_full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    campus_type_display = serializers.CharField(source='get_campus_type_display', read_only=True)
    sub_extensions_count = serializers.IntegerField(source='sub_extensions.count', read_only=True)

    class Meta:
        model = Campus
        fields = '__all__'

