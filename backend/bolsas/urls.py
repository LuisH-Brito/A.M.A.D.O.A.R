from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BolsaViewSet

router = DefaultRouter()
router.register(r'estoque', BolsaViewSet, basename='bolsa')

urlpatterns = [
    path('', include(router.urls)),
]