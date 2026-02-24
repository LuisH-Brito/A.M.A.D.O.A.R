from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerguntaViewSet, SalvarQuestionarioView

router = DefaultRouter()
router.register(r'perguntas', PerguntaViewSet, basename='pergunta')

urlpatterns = [
    path('', include(router.urls)),
    path('questionarios/', SalvarQuestionarioView.as_view(), name='salvar-questionario'),
]