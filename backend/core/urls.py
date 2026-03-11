from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TipoSanguineoViewSet

router = DefaultRouter()
router.register(r'tipos-sanguineos', TipoSanguineoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]