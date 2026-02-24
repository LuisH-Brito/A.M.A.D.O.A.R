from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DoadorViewSet

router = DefaultRouter()
router.register(r'doadores', DoadorViewSet, basename='doador')

urlpatterns = [
    path('', include(router.urls)),
]