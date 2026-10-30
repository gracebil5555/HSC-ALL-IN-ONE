from rest_framework import serializers
from .models import User
from apps.campuses.models import Campus

class UserSerializer(serializers.ModelSerializer):
    campus = serializers.PrimaryKeyRelatedField(
        queryset=Campus.objects.all(),
        required=False,
        allow_null=True
    )
    campus_id = serializers.IntegerField(source='campus.id', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    ecclesial_function_display = serializers.CharField(source='get_ecclesial_function_display', read_only=True)
    deputy_of_name = serializers.CharField(source='deputy_of.get_full_name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'title', 'role', 'role_display', 'ecclesial_function', 
            'ecclesial_function_display', 'campus', 'campus_id', 'campus_name',
            'avatar', 'phone', 'is_active', 'is_deputy', 'deputy_of', 
            'deputy_of_name', 'delegated_permissions', 'password'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password("HSC@2026") # Mot de passe initial par défaut
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


