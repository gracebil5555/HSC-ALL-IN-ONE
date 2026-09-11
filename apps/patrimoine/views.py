from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import transaction
from .models import Asset, ConsumableItem, StockMovement
from .serializers import AssetSerializer, ConsumableItemSerializer, StockMovementSerializer

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by('-created_at')
    serializer_class = AssetSerializer
    permission_classes = [AllowAny]

class ConsumableItemViewSet(viewsets.ModelViewSet):
    queryset = ConsumableItem.objects.all().order_by('name')
    serializer_class = ConsumableItemSerializer
    permission_classes = [AllowAny]

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all().order_by('-created_at')
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            movement = serializer.save(performed_by=request.user if request.user.is_authenticated else None)
            
            # Update stock quantity
            item = movement.item
            qty = abs(movement.quantity)
            
            if movement.movement_type == 'IN':
                item.quantity_in_stock += qty
            elif movement.movement_type == 'OUT':
                item.quantity_in_stock -= qty
            elif movement.movement_type == 'ADJUST':
                # For adjust, we replace the stock or adjust it based on the frontend logic.
                # Usually adjust is an exact amount difference. Let's assume it adds to the current stock.
                item.quantity_in_stock += movement.quantity
                
            item.save()
            
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
