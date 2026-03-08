from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BolsaViewSet, NotificacaoEstoqueView

router = DefaultRouter()
router.register(r'estoque', BolsaViewSet, basename='bolsa')

urlpatterns = [
    path('', include(router.urls)),
    path('notificar-estoque/', NotificacaoEstoqueView.as_view(), name='notificar-estoque'),
]