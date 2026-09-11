from rest_framework import serializers
from .models import Brigade, Member, Attendance, PastoralAlert

class BrigadeSerializer(serializers.ModelSerializer):
    leader_name = serializers.CharField(source='leader.get_full_name', read_only=True)

    class Meta:
        model = Brigade
        fields = '__all__'


class MemberSerializer(serializers.ModelSerializer):
    brigade_name = serializers.CharField(source='brigade.name', read_only=True)

    class Meta:
        model = Member
        fields = '__all__'


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
