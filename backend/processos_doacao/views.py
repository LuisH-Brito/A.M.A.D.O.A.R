from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import F, Value
from django.db.models.functions import Replace
from dados_clinicos.models import EnfermeiroDados 
from choices import Papel

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
    queryset = Processo_Doacao.objects.select_related(
        'doador', 'questionario', 'atendimento_usuario'
    ).all()
    serializer_class = ProcessoDoacaoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.action in ['iniciar_atendimento', 'encerrar_atendimento']:
            return [IsAuthenticated()]
        if self.action == 'iniciar':
            return [IsAuthenticated(), EhRecepcionista()]
        if self.action == 'decidir_triagem':
            return [IsAuthenticated(), EhMedico()]
        if self.action == 'finalizar_coleta':
            return [IsAuthenticated(), EhEnfermeiro()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], url_path='atendimento-heartbeat')
    def iniciar_atendimento(self, request, pk=None):
        agora = timezone.now()
        limite = agora - timedelta(seconds=15)

        with transaction.atomic():
            processo = Processo_Doacao.objects.select_for_update().get(pk=pk)
            reserva_expirada = (
                processo.atendimento_atualizado_em is None
                or processo.atendimento_atualizado_em < limite
            )
            ocupado_por_outro = (
                processo.atendimento_usuario_id is not None
                and processo.atendimento_usuario_id != request.user.id
                and not reserva_expirada
            )
            if ocupado_por_outro:
                return Response(
                    {'erro': 'Este processo já está em andamento por outro funcionário.'},
                    status=status.HTTP_409_CONFLICT,
                )

            processo.atendimento_usuario = request.user
            processo.atendimento_atualizado_em = agora
            processo.save(update_fields=['atendimento_usuario', 'atendimento_atualizado_em'])

        return Response({'em_andamento': True})

    @action(detail=True, methods=['delete'], url_path='atendimento')
    def encerrar_atendimento(self, request, pk=None):
        Processo_Doacao.objects.filter(
            pk=pk, atendimento_usuario=request.user,
        ).update(atendimento_usuario=None, atendimento_atualizado_em=None)
        return Response(status=status.HTTP_204_NO_CONTENT)

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

        with transaction.atomic():
            processo.status = novo_status
            processo.save(update_fields=['status'])

            
            if novo_status == StatusProcesso.CANCELADO:
                if hasattr(processo, 'dados_clinicos'):
                    dados = processo.dados_clinicos
                    dados.status_clinico = StatusClinico.INAPTO
                    dados.save(update_fields=['status_clinico'])

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

        with transaction.atomic():
            # Serializa o início de processos para o mesmo doador e evita que
            # requisições concorrentes reutilizem o mesmo questionário.
            doador = Doador.objects.select_for_update().get(pk=doador.pk)

            processo_ativo = (
                Processo_Doacao.objects
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

            questionario_valido = (
                Questionario.elegiveis_para_processo(doador)
                .select_for_update()
                .order_by('-data_hora_submissao')
                .first()
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
        medico_id = request.data.get('medico_id')

        if not pressao_arterial:
            return Response({'erro': 'Pressão arterial é obrigatória.'}, status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(aprovado, bool):
            return Response({'erro': 'Campo "aprovado" deve ser booleano.'}, status=status.HTTP_400_BAD_REQUEST)

        if aprovado and not processo.questionario_id:
            return Response(
                {'erro': 'O processo não possui questionário concluído.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if aprovado and not processo.questionario.validade:
            return Response(
                {
                    'erro': (
                        'O questionário possui respostas incompatíveis com '
                        'a classificação como apto.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            dados, _ = Dados_Clinicos.objects.get_or_create(
                processo=processo,
                defaults={
                    'peso': 0, 'altura': 0, 'hemoglobina': None,
                    'status_clinico': StatusClinico.APTO
                }
            )

            dados.pressao_arterial = pressao_arterial
            dados.status_clinico = StatusClinico.APTO if aprovado else StatusClinico.INAPTO
            dados.save()

            if medico_id:
                from medicos.models import Medico
                from dados_clinicos.models import MedicoDados 
                
                try:
                    medico = Medico.objects.get(id=medico_id)
                    MedicoDados.objects.create(
                        medico=medico,
                        dados=dados,
                        papel=Papel.RESPONSAVEL_TRIAGEM
                    )
                except Medico.DoesNotExist:
                    return Response(
                        {"erro": "Médico responsável não encontrado."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        return Response({
            'mensagem': 'Dados da triagem registrados com sucesso.',
            'processo_id': processo.id,
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

        if not enfermeiro.is_active:
            return Response(
                {'erro': 'O enfermeiro selecionado nao esta ativo.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            dados_clinicos = processo.dados_clinicos
            
            EnfermeiroDados.objects.create(
                enfermeiro=enfermeiro,
                dados=dados_clinicos,
                papel=Papel.RESPONSAVEL_COLETA
            )

            if not puncao_sucesso:
                processo.status = StatusProcesso.CANCELADO
                processo.save(update_fields=['status'])
                
                dados_clinicos.status_clinico = StatusClinico.INAPTO
                dados_clinicos.save(update_fields=['status_clinico']) 
                
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
                return Response({'erro': 'Este processo ja possui bolsa gerada.'}, status=status.HTTP_400_BAD_REQUEST)

    
            bolsa = Bolsa.objects.create(
                processo=processo,
                doador=processo.doador,
                tipo_sanguineo=None, 
                enfermeiro_coleta=enfermeiro,
                status=StatusBolsa.AGUARDANDO
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
