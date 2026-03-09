from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DadosClinicosViewSet

router = DefaultRouter()
router.register(r'dados-clinicos', DadosClinicosViewSet, basename='dados-clinicos')

urlpatterns = [
    path('', include(router.urls)),
]