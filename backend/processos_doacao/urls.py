from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcessoDoacaoViewSet

router = DefaultRouter()
router.register(r'processos', ProcessoDoacaoViewSet, basename='processo')

urlpatterns = [
    path('', include(router.urls)),
]
