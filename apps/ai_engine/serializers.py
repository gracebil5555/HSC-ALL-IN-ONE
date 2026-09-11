from rest_framework import serializers
from .models import AILog

class AILogSerializer(serializers.ModelSerializer):
    initiated_by_name = serializers.CharField(source='initiated_by.get_full_name', read_only=True)

    class Meta:
        model = AILog
        fields = '__all__'
