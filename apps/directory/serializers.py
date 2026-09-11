from rest_framework import serializers
from .models import BusinessProfile

class BusinessProfileSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    whatsapp_link = serializers.CharField(source='get_whatsapp_link', read_only=True)

    class Meta:
        model = BusinessProfile
        fields = '__all__'
