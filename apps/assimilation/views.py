from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import AssimilationProfile, ClassSession, BaptismInterview
from .serializers import AssimilationProfileSerializer, ClassSessionSerializer, BaptismInterviewSerializer

class AssimilationProfileViewSet(viewsets.ModelViewSet):
    queryset = AssimilationProfile.objects.all().order_by('-started_at')
    serializer_class = AssimilationProfileSerializer
    permission_classes = [AllowAny]

class ClassSessionViewSet(viewsets.ModelViewSet):
    queryset = ClassSession.objects.all().order_by('-date')
    serializer_class = ClassSessionSerializer
    permission_classes = [AllowAny]

class BaptismInterviewViewSet(viewsets.ModelViewSet):
    queryset = BaptismInterview.objects.all().order_by('-interview_date')
    serializer_class = BaptismInterviewSerializer
    permission_classes = [AllowAny]
