from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import F, Value
from django.db.models.functions import Replace

from usuarios.permission import EhRecepcionista, EhMedico, EhEnfermeiro
from doadores.models import Doador
from enfermeiros.models import Enfermeiro
from core.models import Tipo_Sanguineo
from bolsas.models import Bolsa
from triagem.models import Questionario, Resposta
from dados_clinicos.models import Dados_Clinicos
from choices import StatusProcesso, StatusClinico, StatusBolsa

from .models import Processo_Doacao
from .serializers import ProcessoDoacaoSerializer


class ProcessoDoacaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Processo_Doacao.objects.select_related('doador', 'questionario').all()
    serializer_class = ProcessoDoacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'iniciar':
            return [IsAuthenticated(), EhRecepcionista()]
        if self.action == 'decidir_triagem':
            return [IsAuthenticated(), EhMedico()]
        if self.action == 'finalizar_coleta':
            return [IsAuthenticated(), EhEnfermeiro()]
        return [IsAuthenticated()]

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

    @action(detail=False, methods=['post'], url_path='iniciar')
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

        recepcionista = getattr(request.user, 'recepcionista', None)
        if not recepcionista:
            return Response({'erro': 'Usuário não é recepcionista.'}, status=status.HTTP_403_FORBIDDEN)

        questionario_valido = (
            Questionario.objects
            .filter(doador=doador, validade=True, processo__isnull=True)
            .order_by('-data_hora_submissao')
            .first()
        )

        with transaction.atomic():
            processo_ativo = (
                Processo_Doacao.objects
                .select_for_update()
                .filter(doador=doador)
                .exclude(status__in=[StatusProcesso.CONCLUIDO, StatusProcesso.CANCELADO])
                .order_by('-data_inicio')
                .first()
            )

            if processo_ativo:
                return Response(
                    {
                        'erro': 'Este doador já possui um processo em andamento.',
                        'processo_id': processo_ativo.id,
                        'status': processo_ativo.status,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            processo = Processo_Doacao.objects.create(
                doador=doador,
                recepcionista=recepcionista,
                questionario=questionario_valido,
                status=StatusProcesso.PRE_TRIAGEM
            )

        return Response(self.get_serializer(processo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='decidir-triagem')
    def decidir_triagem(self, request, pk=None):
        processo = self.get_object()

        if processo.status != StatusProcesso.TRIAGEM:
            return Response(
                {'erro': 'Este processo não está na etapa de triagem.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pressao_arterial = (request.data.get('pressao_arterial') or '').strip()
        aprovado = request.data.get('aprovado')

        if not pressao_arterial:
            return Response({'erro': 'Pressão arterial é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(aprovado, bool):
            return Response({'erro': 'Campo "aprovado" deve ser booleano.'}, status=status.HTTP_400_BAD_REQUEST)

        dados, _ = Dados_Clinicos.objects.get_or_create(
            processo=processo,
            defaults={
                'peso': 0,
                'altura': 0,
                'hemoglobina': 0,
                'status_clinico': StatusClinico.APTO
            }
        )

        dados.pressao_arterial = pressao_arterial
        dados.status_clinico = StatusClinico.APTO if aprovado else StatusClinico.INAPTO
        dados.save()

        if aprovado:
            # "Apto na triagem" mapeado para próxima etapa operacional: coleta
            processo.status = StatusProcesso.COLETA
        else:
            # Encerrado por inaptidão
            processo.status = StatusProcesso.CANCELADO

        processo.save(update_fields=['status'])

        return Response({
            'mensagem': 'Triagem registrada com sucesso.',
            'processo_id': processo.id,
            'status': processo.status,
            'status_clinico': dados.status_clinico
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='finalizar-coleta')
    def finalizar_coleta(self, request, pk=None):
        processo = self.get_object()

        if processo.status != StatusProcesso.COLETA:
            return Response(
                {'erro': 'Este processo nao esta na etapa de coleta.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enfermeiro_id = request.data.get('enfermeiro_id')
        puncao_sucesso = request.data.get('puncao_sucesso')

        if enfermeiro_id is None:
            return Response(
                {'erro': 'Campo enfermeiro_id e obrigatorio.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            enfermeiro_id = int(enfermeiro_id)
        except (TypeError, ValueError):
            return Response(
                {'erro': 'Campo enfermeiro_id invalido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(puncao_sucesso, bool):
            return Response(
                {'erro': 'Campo puncao_sucesso deve ser booleano.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enfermeiro = Enfermeiro.objects.filter(id=enfermeiro_id).first()
        if not enfermeiro:
            return Response(
                {'erro': 'Enfermeiro responsavel nao encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not puncao_sucesso:
            processo.status = StatusProcesso.CANCELADO
            processo.save(update_fields=['status'])
            return Response(
                {
                    'mensagem': 'Coleta finalizada sem sucesso. Processo encerrado como cancelado.',
                    'processo_id': processo.id,
                    'status': processo.status,
                    'bolsa_criada': False,
                },
                status=status.HTTP_200_OK
            )

        if processo.bolsas.exists():
            return Response(
                {'erro': 'Este processo ja possui bolsa gerada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo = processo.doador.tipo_sanguineo_declarado
        fator = processo.doador.fator_rh
        tipo_sanguineo = Tipo_Sanguineo.objects.filter(tipo=tipo, fator_rh=fator).first()

        if not tipo_sanguineo:
            return Response(
                {'erro': 'Nao foi possivel identificar o tipo sanguineo do doador para gerar a bolsa.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            bolsa = Bolsa.objects.create(
                processo=processo,
                doador=processo.doador,
                tipo_sanguineo=tipo_sanguineo,
                enfermeiro_coleta=enfermeiro,
                status=StatusBolsa.AGUARDANDO,
                data_vencimento=timezone.now().date() + timedelta(days=35),
            )

            processo.status = StatusProcesso.CONCLUIDO
            processo.save(update_fields=['status'])

        return Response(
            {
                'mensagem': 'Coleta finalizada com sucesso. Bolsa gerada e enviada para validacao.',
                'processo_id': processo.id,
                'status': processo.status,
                'bolsa_criada': True,
                'bolsa_id': bolsa.id,
            },
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=True,
        methods=['get'],
        url_path='questionario',
        permission_classes=[IsAuthenticated]
    )
    def questionario(self, request, pk=None):
        processo = self.get_object()
        questionario = processo.questionario

        if not questionario:
            return Response(
                {'erro': 'Processo sem questionário vinculado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        respostas = (
            Resposta.objects
            .filter(questionario=questionario)
            .select_related('pergunta')
            .order_by('id')
        )

        return Response({
            'processo_id': processo.id,
            'questionario_id': questionario.id,
            'validade': questionario.validade,
            'data_hora_submissao': questionario.data_hora_submissao,
            'respostas': [
                {
                    'pergunta_texto': r.pergunta.texto,
                    'resposta_dada': r.resposta_texto,
                    'resposta_esperada': r.pergunta.resposta_esperada,
                    'motivo_inaptidao': r.pergunta.motivo_inaptidao
                }
                for r in respostas
            ]
        }, status=status.HTTP_200_OK)
