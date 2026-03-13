from rest_framework import viewsets
from .models import Doador
from .serializers import DoadorSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, permissions
from .serializers import DoadorSerializer
from usuarios.permission import EhRecepcionista
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import F, Value
from django.db.models.functions import Replace

class DoadorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar Doadores com permissões granulares:
    - POST: Aberto para qualquer pessoa se cadastrar.
    - GET (lista): Recepcionistas veem todos, Doadores veem apenas a si mesmos.
    - OUTROS: Exige autenticação.
    """
    queryset = Doador.objects.all()
    pagination_class = None

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

        if hasattr(user, 'administrador') or user.is_superuser or hasattr(user, 'recepcionista') or hasattr(user, 'enfermeiro') or hasattr(user, 'medico'):
            queryset = Doador.objects.all()
        else:
            queryset = Doador.objects.filter(pk=user.pk)

        cpf = (self.request.query_params.get('cpf') or '').strip()
        if cpf:
            cpf_numerico = ''.join(ch for ch in cpf if ch.isdigit())

            # Normaliza CPF salvo no banco para comparar só dígitos
            queryset = queryset.annotate(
                cpf_numerico=Replace(
                    Replace(F('cpf'), Value('.'), Value('')),
                    Value('-'),
                    Value('')
                )
            ).filter(cpf_numerico=cpf_numerico)

        return queryset


    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):

        doador = Doador.objects.get(pk=request.user.pk)

        if request.method == 'GET':
            serializer = self.get_serializer(doador)
            return Response(serializer.data)

        if request.method == 'PATCH':
            serializer = self.get_serializer(doador, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

            return Response(serializer.errors, status=400)
        
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def atualizar_tipo_sanguineo(self, request, pk=None):
        """
        Atualiza o tipo sanguíneo do doador a partir da validação médica da bolsa.
        """
        doador = self.get_object()
        novo_tipo = request.data.get('tipo_sanguineo')
        novo_fator = request.data.get('fator_rh')

        if not novo_tipo or not novo_fator:
            return Response({'erro': 'Tipo sanguíneo e Fator RH são obrigatórios.'}, status=400)

        mudou = False
        
        if doador.tipo_sanguineo_declarado != novo_tipo or doador.fator_rh != novo_fator:
            doador.tipo_sanguineo_declarado = novo_tipo
            doador.fator_rh = novo_fator
            doador.save()
            mudou = True   

        mensagem = 'Tipo sanguíneo do doador atualizado com sucesso.' if mudou else 'O doador já possuía este tipo sanguíneo.'
        return Response({'mensagem': mensagem, 'atualizado': mudou})

    def perform_create(self, serializer):
        """
        Opcional: Se o Doador for criado via POST aberto, você pode querer 
        alguma lógica extra aqui, como salvar o usuário como 'ativo' etc.
        """
        serializer.save()