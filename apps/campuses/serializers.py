from rest_framework import serializers
from .models import Campus

class CampusSerializer(serializers.ModelSerializer):
    lead_pastor_name = serializers.CharField(source='lead_pastor.get_full_name', read_only=True)

    class Meta:
        model = Campus
        fields = '__all__'
