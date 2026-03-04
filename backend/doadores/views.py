from rest_framework import viewsets
from .models import Doador
from .serializers import DoadorSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, permissions
from .serializers import DoadorSerializer
from usuarios.permission import EhRecepcionista


class DoadorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Doadores com permissões granulares:
    - POST: Aberto para qualquer pessoa se cadastrar.
    - GET (lista): Recepcionistas veem todos, Doadores veem apenas a si mesmos.
    - OUTROS: Exige autenticação.
    """
    queryset = Doador.objects.all()
    serializer_class = DoadorSerializer 

    def get_permissions(self):
        """
        Define as travas de segurança por ação (POST, GET, etc).
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        """
        Filtra os dados no banco de acordo com quem está logado.
        """
        user = self.request.user
        if hasattr(user, 'administrador'):
            return Doador.objects.all()

        if user.is_superuser:
            return Doador.objects.all()

        if hasattr(user, 'recepcionista'):
            return Doador.objects.all()


        return Doador.objects.filter(pk=user.pk)

    def perform_create(self, serializer):
        """
        Opcional: Se o Doador for criado via POST aberto, você pode querer 
        alguma lógica extra aqui, como salvar o usuário como 'ativo' etc.
        """
        serializer.save()