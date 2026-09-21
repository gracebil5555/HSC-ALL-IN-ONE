from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    campus_id = serializers.PrimaryKeyRelatedField(source='campus', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    ecclesial_function_display = serializers.CharField(source='get_ecclesial_function_display', read_only=True)
    deputy_of_name = serializers.CharField(source='deputy_of.get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'title', 'role', 'role_display', 'ecclesial_function', 
            'ecclesial_function_display', 'campus_id', 'campus_name',
            'avatar', 'phone', 'is_active', 'is_deputy', 'deputy_of', 
            'deputy_of_name', 'delegated_permissions'
        ]
        extra_kwargs = {'password': {'write_only': True}}

