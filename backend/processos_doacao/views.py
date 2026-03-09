from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Value
from django.db.models.functions import Replace
from usuarios.permission import EhRecepcionista
from doadores.models import Doador
from triagem.models import Questionario
from choices import StatusProcesso

from .models import Processo_Doacao
from .serializers import ProcessoDoacaoSerializer
from rest_framework.permissions import IsAuthenticated

class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class ProcessoDoacaoViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows processsos de doação to be viewed."""
    queryset = Processo_Doacao.objects.select_related('doador').all()
    serializer_class = ProcessoDoacaoSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['patch'], url_path='atualizar-status')
    def atualizar_status(self, request, pk=None):
        processo = self.get_object()
        novo_status = request.data.get('status')

        if novo_status is None:
            return Response({'erro': 'Campo status é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            novo_status = int(novo_status)
        except (TypeError, ValueError):
            return Response({'erro': 'Status inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        status_validos = [s[0] for s in Processo_Doacao._meta.get_field('status').choices]
        if novo_status not in status_validos:
            return Response({'erro': 'Status fora das opções permitidas.'}, status=status.HTTP_400_BAD_REQUEST)

        processo.status = novo_status
        processo.save(update_fields=['status'])

        return Response(self.get_serializer(processo).data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['post'],
        url_path='iniciar',
        permission_classes=[IsAuthenticated, EhRecepcionista]
    )
    def iniciar(self, request):
        cpf = (request.data.get('cpf') or '').strip()
        if not cpf:
            return Response({'erro': 'CPF é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        cpf_numerico = ''.join(ch for ch in cpf if ch.isdigit())

        doador = (
            Doador.objects
            .annotate(
                cpf_numerico=Replace(
                    Replace(F('cpf'), Value('.'), Value('')),
                    Value('-'), Value('')
                )
            )
            .filter(cpf_numerico=cpf_numerico)
            .first()
        )

        if not doador:
            return Response({'erro': 'Doador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        questionario_valido = (
            Questionario.objects
            .filter(doador=doador, validade=True, processo__isnull=True)
            .order_by('-data_hora_submissao')
            .first()
        )

        recepcionista = getattr(request.user, 'recepcionista', None)
        if not recepcionista:
            return Response({'erro': 'Usuário não é recepcionista.'}, status=status.HTTP_403_FORBIDDEN)

        processo = Processo_Doacao.objects.create(
            doador=doador,
            recepcionista=recepcionista,
            questionario=questionario_valido,
            status=StatusProcesso.PRE_TRIAGEM
        )

        return Response(self.get_serializer(processo).data, status=status.HTTP_201_CREATED)
