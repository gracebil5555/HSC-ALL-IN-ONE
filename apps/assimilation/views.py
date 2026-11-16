from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import RoleFilterMixin, IsAdjointOrAbove, AdjointCanPerformAction
from .models import AssimilationProfile, ClassSession, BaptismInterview
from .serializers import AssimilationProfileSerializer, ClassSessionSerializer, BaptismInterviewSerializer

class AssimilationProfileViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = AssimilationProfile.objects.all().order_by('-started_at')
    serializer_class = AssimilationProfileSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

class ClassSessionViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = ClassSession.objects.all().order_by('-date')
    serializer_class = ClassSessionSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

class BaptismInterviewViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = BaptismInterview.objects.all().order_by('-interview_date')
    serializer_class = BaptismInterviewSerializer
    permission_classes = [IsAuthenticated, IsAdjointOrAbove, AdjointCanPerformAction]

