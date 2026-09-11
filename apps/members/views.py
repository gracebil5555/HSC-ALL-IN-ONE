from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Brigade, Member, Attendance, PastoralAlert
from .serializers import BrigadeSerializer, MemberSerializer, AttendanceSerializer, PastoralAlertSerializer

class BrigadeViewSet(viewsets.ModelViewSet):
    queryset = Brigade.objects.all()
    serializer_class = BrigadeSerializer
    permission_classes = [AllowAny]

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by('-created_at')
    serializer_class = MemberSerializer
    permission_classes = [AllowAny]

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [AllowAny]

class PastoralAlertViewSet(viewsets.ModelViewSet):
    queryset = PastoralAlert.objects.all().order_by('-created_at')
    serializer_class = PastoralAlertSerializer
    permission_classes = [AllowAny]
