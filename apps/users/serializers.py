from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    campus_id = serializers.PrimaryKeyRelatedField(source='campus', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'title', 'role', 'campus_id', 'avatar', 'phone', 'is_active']
