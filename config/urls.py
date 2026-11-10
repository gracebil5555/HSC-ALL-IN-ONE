"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def root_api_index(request):
    """
    Page d'accueil de l'API pour éviter le 404 lorsque l'utilisateur visite la racine.
    """
    return JsonResponse({
        "system": "HSC Management System API",
        "status": "online",
        "version": "1.0.0",
        "description": "Plateforme ecclésiale multi-sites Hauts Standards pour Christ",
        "documentation": {
            "swagger_ui": "/api/docs/",
            "redoc": "/api/redoc/",
            "openapi_schema": "/api/schema/"
        },
        "endpoints": {
            "admin": "/admin/",
            "auth_token": "/api/v1/auth/jwt/create/",
            "auth_refresh": "/api/v1/auth/jwt/refresh/",
            "campuses": "/api/v1/campuses/",
            "users": "/api/v1/users/",
            "departments": "/api/v1/departments/",
            "members": "/api/v1/members/list/",
            "finances": "/api/v1/finances/transactions/"
        }
    })

urlpatterns = [
    path('', root_api_index, name='api-root-index'),
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/v1/auth/jwt/create/', TokenObtainPairView.as_view(), name='jwt-create'),
    path('api/v1/auth/jwt/refresh/', TokenRefreshView.as_view(), name='jwt-refresh'),
    path('api/v1/', include('config.api_router')),

    # OpenAPI 3 Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
