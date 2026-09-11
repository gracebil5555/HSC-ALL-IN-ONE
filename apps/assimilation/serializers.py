from rest_framework import serializers
from .models import AssimilationProfile, ClassSession, BaptismInterview

class AssimilationProfileSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)

    class Meta:
        model = AssimilationProfile
        fields = '__all__'


class ClassSessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)

    class Meta:
        model = ClassSession
        fields = '__all__'


class BaptismInterviewSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    pastor_name = serializers.CharField(source='pastor.get_full_name', read_only=True)

    class Meta:
        model = BaptismInterview
        fields = '__all__'
