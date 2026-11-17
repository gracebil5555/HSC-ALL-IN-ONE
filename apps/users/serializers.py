from rest_framework import serializers
from .models import User, RoleAssignment
from .permissions import _effective_role, _get_user_department_codes
from apps.campuses.models import Campus
from apps.departments.models import Department


class UserSerializer(serializers.ModelSerializer):
    campus = serializers.PrimaryKeyRelatedField(
        queryset=Campus.objects.all(),
        required=False,
        allow_null=True
    )
    campus_id = serializers.SerializerMethodField()
    campus_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    effective_role = serializers.SerializerMethodField()
    ecclesial_function = serializers.CharField(max_length=40, default="FIDELE", required=False)
    ecclesial_function_display = serializers.SerializerMethodField()
    deputy_of_name = serializers.CharField(source='deputy_of.get_full_name', read_only=True)
    deputy_of_role = serializers.CharField(source='deputy_of.role', read_only=True)
    administered_departments = serializers.SerializerMethodField()
    department_codes = serializers.SerializerMethodField()
    department_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'title', 'role', 'role_display', 'effective_role',
            'ecclesial_function', 'ecclesial_function_display',
            'campus', 'campus_id', 'campus_name',
            'avatar', 'phone', 'is_active',
            'is_deputy', 'deputy_of', 'deputy_of_name', 'deputy_of_role',
            'delegated_permissions',
            'administered_departments', 'department_codes', 'department_id',
            'password'
        ]
        read_only_fields = ['is_deputy', 'deputy_of', 'delegated_permissions']

    def get_campus_id(self, obj):
        if _effective_role(obj) == "SUPER_SUPER_ADMIN":
            return None
        if obj.campus_id:
            return str(obj.campus_id)
        if obj.is_deputy and obj.deputy_of and obj.deputy_of.campus_id:
            return str(obj.deputy_of.campus_id)
        return None

    def get_campus_name(self, obj):
        if _effective_role(obj) == "SUPER_SUPER_ADMIN":
            return None
        if obj.campus:
            return obj.campus.name
        if obj.is_deputy and obj.deputy_of and obj.deputy_of.campus:
            return obj.deputy_of.campus.name
        return None

    def get_effective_role(self, obj):
        return _effective_role(obj)

    def get_ecclesial_function_display(self, obj):
        from apps.members.models import EcclesialFunctionCatalog
        cat = EcclesialFunctionCatalog.objects.filter(code=obj.ecclesial_function).values_list("label", flat=True).first()
        if cat:
            return cat
        return dict(User.ECCLESIAL_FUNCTION_CHOICES).get(obj.ecclesial_function, obj.ecclesial_function)

    def get_administered_departments(self, obj):
        items = []
        seen = set()
        for d in obj.administered_departments.filter(is_active=True):
            seen.add(d.id)
            items.append({
                "id": d.id,
                "name": d.name,
                "code": d.code or (d.catalog_item.code if d.catalog_item else ""),
                "campus_id": str(d.campus_id),
                "is_deputy": False,
            })
        for d in obj.deputy_departments.filter(is_active=True):
            if d.id not in seen:
                seen.add(d.id)
                items.append({
                    "id": d.id,
                    "name": d.name,
                    "code": d.code or (d.catalog_item.code if d.catalog_item else ""),
                    "campus_id": str(d.campus_id),
                    "is_deputy": True,
                })
        if obj.is_deputy and obj.deputy_of:
            for d in obj.deputy_of.administered_departments.filter(is_active=True):
                if d.id not in seen:
                    seen.add(d.id)
                    items.append({
                        "id": d.id,
                        "name": d.name,
                        "code": d.code or (d.catalog_item.code if d.catalog_item else ""),
                        "campus_id": str(d.campus_id),
                        "is_deputy": True,
                    })
        return items

    def get_department_codes(self, obj):
        return sorted(_get_user_department_codes(obj))

    def _assign_department(self, user, department_id):
        if not department_id:
            return
        try:
            dept = Department.objects.get(pk=department_id)
            if user.campus_id and dept.campus_id != user.campus_id:
                return
            if user.is_deputy or user.role == "ADJOINT":
                dept.deputy = user
                if dept.admin_id and not user.deputy_of_id:
                    user.deputy_of_id = dept.admin_id
                    user.is_deputy = True
                    user.save(update_fields=["deputy_of_id", "is_deputy"])
                dept.save()
            elif user.role == "ADMIN_DEPT":
                dept.admin = user
                dept.save()
        except Department.DoesNotExist:
            pass

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        department_id = validated_data.pop('department_id', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password("HSC@2026")
        user.save()
        self._assign_department(user, department_id)
        return user


class RoleAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    brigade_name = serializers.CharField(source='brigade.name', read_only=True)
    deputy_of_name = serializers.CharField(source='deputy_of.get_full_name', read_only=True)
    appointed_by_name = serializers.CharField(source='appointed_by.get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = RoleAssignment
        fields = '__all__'
        read_only_fields = ['appointed_by', 'created_at']


    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        department_id = validated_data.pop('department_id', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        self._assign_department(user, department_id)
        return user


class RoleAssignmentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    brigade_name = serializers.CharField(source='brigade.name', read_only=True)
    deputy_of_name = serializers.CharField(source='deputy_of.get_full_name', read_only=True)
    appointed_by_name = serializers.CharField(source='appointed_by.get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = RoleAssignment
        fields = '__all__'
        read_only_fields = ['appointed_by', 'created_at']




