from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListarQuestionariosView, PerguntaViewSet, SalvarQuestionarioView

router = DefaultRouter()
router.register(r'perguntas', PerguntaViewSet, basename='pergunta')

urlpatterns = [
    path('questionarios/', SalvarQuestionarioView.as_view(), name='salvar-questionario'),
    path('listar-questionarios/', ListarQuestionariosView.as_view(), name='listar-questionarios'),
    path('', include(router.urls)),
]