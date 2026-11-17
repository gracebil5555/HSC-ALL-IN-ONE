from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from apps.users.permissions import _effective_role
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

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")

        if self.instance is not None:
            # Empêcher les cycles dans la hiérarchie parent/enfant
            if "parent" in attrs and attrs["parent"] is not None:
                parent = attrs["parent"]
                if parent.pk == self.instance.pk:
                    raise serializers.ValidationError({"parent": "Un campus ne peut pas être son propre parent."})
                visited = {self.instance.pk}
                curr = parent
                while curr is not None:
                    if curr.pk in visited:
                        raise serializers.ValidationError({"parent": "Hiérarchie invalide : cycle détecté."})
                    visited.add(curr.pk)
                    curr = curr.parent

            # Seul le SUPER_SUPER_ADMIN peut modifier parent, campus_type ou lead_pastor
            if request and request.user and request.user.is_authenticated:
                if _effective_role(request.user) != "SUPER_SUPER_ADMIN":
                    for restricted_field in ("parent", "campus_type", "lead_pastor"):
                        if restricted_field in attrs and attrs[restricted_field] != getattr(self.instance, restricted_field):
                            raise PermissionDenied(
                                f"Action refusée : seul le Super Super Admin peut modifier le champ '{restricted_field}'."
                            )

        return attrs


