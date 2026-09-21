from rest_framework import serializers
from .models import Department, DepartmentCatalog

class DepartmentCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentCatalog
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    admin_name = serializers.CharField(source='admin.get_full_name', read_only=True)
    deputy_name = serializers.CharField(source='deputy.get_full_name', read_only=True)

    class Meta:
        model = Department
        fields = '__all__'

