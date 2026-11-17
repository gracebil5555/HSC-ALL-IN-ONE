from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from apps.users.permissions import (
    RoleFilterMixin,
    IsAdminDeptOfCampus,
    AdjointCanPerformAction,
    _effective_role,
    _effective_campus_id,
)
from .models import Asset, AssetMovement, ConsumableItem, StockMovement
from .serializers import (
    AssetSerializer,
    AssetMovementSerializer,
    ConsumableItemSerializer,
    StockMovementSerializer,
)


class AssetViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Registre des actifs & amortissements (Section 13 & 20) :
    - Isolé par Église / campus.
    - Réservé au Super Admin (ou Super Super Admin) et à l'Admin Patrimoine (+ leurs adjoints).
    """
    queryset = Asset.objects.select_related(
        "campus", "assigned_to", "department"
    ).prefetch_related("movements", "movements__responsible").all().order_by('-created_at')
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["PATRIMOINE"]


class AssetMovementViewSet(RoleFilterMixin, viewsets.ModelViewSet):
    """
    Historique des mouvements, affectations, maintenances et contrôles périodiques des actifs (Section 13).
    """
    queryset = AssetMovement.objects.select_related(
        "campus", "asset", "responsible"
    ).all().order_by('-movement_date', '-created_at')
    serializer_class = AssetMovementSerializer
    permission_classes = [IsAuthenticated, IsAdminDeptOfCampus, AdjointCanPerformAction]
    allowed_department_codes = ["PATRIMOINE"]

    def get_queryset(self):
        qs = super().get_queryset()
        asset_id = self.request.query_params.get("asset_id")
        if asset_id:
            qs = qs.filter(asset_id=asset_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        asset = serializer.validated_data.get("asset")
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            effective_campus_id = _effective_campus_id(user)
            if not asset or str(asset.campus_id) != str(effective_campus_id):
                raise PermissionDenied("Action refusée : cet actif n'appartient pas à votre campus.")

        with transaction.atomic():
            responsible = serializer.validated_data.get("responsible") or (
                user if user.is_authenticated else None
            )
            movement = serializer.save(
                campus_id=asset.campus_id,
                responsible=responsible,
            )
            update_fields = []
            if movement.observed_condition and asset.condition != movement.observed_condition:
                asset.condition = movement.observed_condition
                update_fields.append("condition")
            if movement.to_location and asset.location != movement.to_location:
                asset.location = movement.to_location
                update_fields.append("location")
            if update_fields:
                asset.save(update_fields=update_fields + ["updated_at"])


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

        item = serializer.validated_data.get("item")
        if _effective_role(user) != "SUPER_SUPER_ADMIN":
            effective_campus_id = _effective_campus_id(user)
            if not item or str(item.campus_id) != str(effective_campus_id):
                raise PermissionDenied("Action refusée : cet article consommable n'appartient pas à votre campus.")

        with transaction.atomic():
            movement = serializer.save(
                performed_by=user if user.is_authenticated else None,
                campus_id=item.campus_id,
            )

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
