from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from apps.users.permissions import (
    RoleFilterMixin,
    IsAdminDeptOfCampus,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
)
from .models import Asset, ConsumableItem, StockMovement
from .serializers import AssetSerializer, ConsumableItemSerializer, StockMovementSerializer


class AssetViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Registre des actifs & amortissements (Section 13 & 20) :
    - Isolé par Église / campus.
    - Réservé au Super Admin (ou Super Super Admin) et à l'Admin Patrimoine (+ leurs adjoints).
    """
    queryset = Asset.objects.select_related("campus", "assigned_to").all().order_by('-created_at')
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["PATRIMOINE"]


class ConsumableItemViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = ConsumableItem.objects.select_related("campus").all().order_by('name')
    serializer_class = ConsumableItemSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["PATRIMOINE"]


class StockMovementViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related("campus", "item", "performed_by").all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["PATRIMOINE"]

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        user = request.user
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            campus_id = _effective_campus_id(user)
            if campus_id:
                data["campus"] = campus_id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            movement = serializer.save(performed_by=user if user.is_authenticated else None)

            item = movement.item
            qty = abs(movement.quantity)

            if movement.movement_type == 'IN':
                item.quantity_in_stock += qty
            elif movement.movement_type == 'OUT':
                item.quantity_in_stock = max(0, item.quantity_in_stock - qty)
            elif movement.movement_type == 'ADJUST':
                item.quantity_in_stock = max(0, item.quantity_in_stock + movement.quantity)

            item.save()

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

