from rest_framework import serializers
from .models import (
    Brigade,
    Member,
    Attendance,
    PastoralAlert,
    EcclesialFunctionCatalog,
    MemberStatusCatalog,
    MemberTransferRequest,
)

STAGE_TO_FRONT = {
    "CONTACT": "ACCUEIL",
    "M1": "MODULE_1",
    "M2": "MODULE_2",
    "BAPTISM": "BAPTEME",
    "INTEGRATED": "INTEGRE",
}
FRONT_TO_STAGE = {v: k for k, v in STAGE_TO_FRONT.items()}
STAGE_PROGRESS = {
    "CONTACT": "1/5",
    "M1": "2/5",
    "M2": "3/5",
    "BAPTISM": "4/5",
    "INTEGRATED": "5/5",
}


class EcclesialFunctionCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EcclesialFunctionCatalog
        fields = '__all__'


class MemberStatusCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberStatusCatalog
        fields = '__all__'


class BrigadeSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.get_full_name', read_only=True)
    leader_phone = serializers.CharField(source='leader.phone', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Brigade
        fields = '__all__'


class MemberSerializer(serializers.ModelSerializer):
    brigade_name = serializers.CharField(source='brigade.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    status = serializers.CharField(max_length=30, default='NOUVEAU', required=False)
    ecclesial_function = serializers.CharField(max_length=40, default='MEMBRE', required=False)
    status_display = serializers.SerializerMethodField()
    ecclesial_function_display = serializers.SerializerMethodField()

    # Champs alignés avec le contrat Frontend
    residential_area = serializers.SerializerMethodField()
    whatsapp = serializers.SerializerMethodField()
    joined_date = serializers.SerializerMethodField()
    assimilation_stage = serializers.SerializerMethodField()
    assimilation_progress = serializers.SerializerMethodField()
    is_baptized = serializers.SerializerMethodField()
    baptism_date = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = '__all__'
        extra_kwargs = {
            'campus': {'required': False},
        }

    def get_residential_area(self, obj):
        return obj.address or ""

    def get_whatsapp(self, obj):
        return obj.phone or ""

    def get_joined_date(self, obj):
        return obj.created_at.strftime("%Y-%m-%d") if obj.created_at else ""

    def get_assimilation_stage(self, obj):
        profile = getattr(obj, "assimilation_profile", None)
        if profile:
            return STAGE_TO_FRONT.get(profile.current_stage, "ACCUEIL")
        return "ACCUEIL"

    def get_assimilation_progress(self, obj):
        profile = getattr(obj, "assimilation_profile", None)
        if profile:
            return STAGE_PROGRESS.get(profile.current_stage, "1/5")
        return "1/5"

    def get_is_baptized(self, obj):
        profile = getattr(obj, "assimilation_profile", None)
        if profile and profile.current_stage == "INTEGRATED":
            return True
        return obj.baptism_interviews.filter(status="APPROVED").exists()

    def get_baptism_date(self, obj):
        approved = obj.baptism_interviews.filter(status="APPROVED").order_by("-scheduled_baptism_date").first()
        if approved and approved.scheduled_baptism_date:
            return approved.scheduled_baptism_date.isoformat()
        return None

    def get_notes(self, obj):
        return ""

    def get_status_display(self, obj):
        cat = MemberStatusCatalog.objects.filter(code=obj.status).values_list("label", flat=True).first()
        if cat:
            return cat
        return dict(Member.STATUS_CHOICES).get(obj.status, obj.status)

    def get_ecclesial_function_display(self, obj):
        cat = EcclesialFunctionCatalog.objects.filter(code=obj.ecclesial_function).values_list("label", flat=True).first()
        if cat:
            return cat
        return dict(Member.ECCLESIAL_FUNCTION_CHOICES).get(obj.ecclesial_function, obj.ecclesial_function)


class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    scanned_by_name = serializers.CharField(source='scanned_by.get_full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'


class PastoralAlertSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    assigned_pastor_name = serializers.CharField(source='assigned_pastor.get_full_name', read_only=True)

    class Meta:
        model = PastoralAlert
        fields = '__all__'


class MemberTransferRequestSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    from_campus_name = serializers.CharField(source='from_campus.name', read_only=True)
    to_campus_name = serializers.CharField(source='to_campus.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)

    class Meta:
        model = MemberTransferRequest
        fields = '__all__'
        read_only_fields = ['from_campus', 'requested_by', 'reviewed_by', 'status', 'reviewed_at']

