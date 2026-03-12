from rest_framework.routers import DefaultRouter
from .views import ExameDoadorViewSet
from django.urls import path, include
router = DefaultRouter()

router.register(r'exames-doador', ExameDoadorViewSet)
urlpatterns = [
    path('', include(router.urls)),
]