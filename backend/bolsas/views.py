from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Bolsa
from .serializers import BolsaSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
import datetime
from rest_framework import status
from .services import notificar_estoque_critico
from django.db.models import Count


class NotificacaoEstoqueView(APIView):
   def post(self, request):
        try:
            notificar_estoque_critico()
            return Response(
                {"status": "Sucesso", "message": "Verificação de estoque concluída e e-mails disparados."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"status": "Erro", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
class BolsaViewSet(viewsets.ModelViewSet):
    """
    API endpoint para visualização e gestão do estoque de bolsas.
    Otimizado com select_related para evitar N+1 queries nas listagens.
    """
    queryset = Bolsa.objects.select_related(
        'processo', 'doador', 'tipo_sanguineo', 'enfermeiro_coleta', 'medico_validacao'
    ).all().order_by('data_vencimento')
    
    serializer_class = BolsaSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tipo_sanguineo', 'data_vencimento']
    search_fields = ['id', 'doador__cpf', 'doador__nome_completo']
    ordering_fields = ['data_vencimento', 'status', 'validacao_at']

    def get_queryset(self):
        """
        Intercepta a requisição para aplicar os filtros das 'Abas' do Frontend.
        """
        qs = super().get_queryset()
        if self.kwargs.get('pk'):
            return qs
        aba = self.request.query_params.get('filtro_aba', 'Todos')
        tipo_sangue = self.request.query_params.get('filtro_tipo', 'Todos')
        hoje = timezone.now().date()
        limite = hoje + datetime.timedelta(days=7)
        STATUS_AGUARDANDO = 1 
        STATUS_VALIDADO = 2 
        STATUS_INAPTO = 3
        STATUS_UTILIZADO = 4
        # Traduz a lógica para SQL
        if aba == 'Aguardando':
            qs = qs.filter(status=STATUS_AGUARDANDO).order_by('processo__data_inicio')
        if aba == 'Bolsa Validas':
            qs = qs.filter(status=STATUS_VALIDADO, data_vencimento__gt=limite)
        elif aba == 'Bolsa Vencendo':
            qs = qs.filter(status=STATUS_VALIDADO, data_vencimento__gte=hoje, data_vencimento__lte=limite)
        elif aba == 'Bolsa Vencidas':
            qs = qs.filter(status=STATUS_VALIDADO, data_vencimento__lt=hoje)
        elif aba == 'Utilizadas':
            qs = qs.filter(status=STATUS_UTILIZADO)
        elif aba == 'Descartadas':
            qs = qs.filter(status=STATUS_INAPTO)
        elif aba == 'Todos':
            qs = qs.filter(status=STATUS_VALIDADO)
        if tipo_sangue and tipo_sangue != 'Todos':
            if len(tipo_sangue) >= 2:
                tipo = tipo_sangue[:-1]  
                fator = tipo_sangue[-1]
                qs = qs.filter(tipo_sanguineo__tipo=tipo, tipo_sanguineo__fator_rh=fator)

        return qs

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def dashboard(self, request):
        """
        Endpoint otimizado para alimentar os KPIs do Frontend.
        Calcula totais de estoque e agrupamento por tipo sanguíneo diretamente no banco.
        """
        hoje = timezone.now().date()
        limite_vencimento = hoje + datetime.timedelta(days=7)
        STATUS_VALIDADO = 2 
        STATUS_INAPTO = 3
        STATUS_UTILIZADO = 4
        agregacoes = Bolsa.objects.aggregate(
            validas=Count('id', filter=Q(status=STATUS_VALIDADO, data_vencimento__gte=hoje)),
            vencendo=Count('id', filter=Q(status=STATUS_VALIDADO, data_vencimento__gte=hoje, data_vencimento__lte=limite_vencimento)),
            vencidas=Count('id', filter=Q(status=STATUS_VALIDADO, data_vencimento__lt=hoje)),
            utilizadas=Count('id', filter=Q(status=STATUS_UTILIZADO)), 
            descartadas=Count('id', filter=Q(status=STATUS_INAPTO)),
            total=Count('id', filter=Q(status=STATUS_VALIDADO))
        )
        tipos_sanguineos_db = Bolsa.objects.filter(
            status=STATUS_VALIDADO, 
            data_vencimento__gte=hoje
        ).values(
            'tipo_sanguineo__tipo', 
            'tipo_sanguineo__fator_rh'
        ).annotate(contagem=Count('id'))

        contagem_padrao = {
            'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 
            'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
        }
        for item in tipos_sanguineos_db:
            sigla = f"{item['tipo_sanguineo__tipo']}{item['tipo_sanguineo__fator_rh']}"
            if sigla in contagem_padrao:
                contagem_padrao[sigla] = item['contagem']
        tags_sangue = [
            {"tipo": tipo, "contagem": contagem}
            for tipo, contagem in contagem_padrao.items()
        ]
        return Response({
            "resumoGeral": {
                "total": agregacoes['total'],
                "validas": agregacoes['validas'],
                "vencendo": agregacoes['vencendo'],
                "vencidas": agregacoes['vencidas'],
                "utilizadas": agregacoes['utilizadas'],
                "descartadas": agregacoes['descartadas']
            },
            "tiposSanguineos": tags_sangue
        })
    
    @action(detail=True, methods=['patch', 'post'])
    def descartar(self, request, pk=None):
        bolsa = self.get_object()
        STATUS_INAPTO = 3

        tipo_id = request.data.get('tipo_sanguineo') or request.POST.get('tipo_sanguineo')
        medico_id = request.data.get('medico_validacao') or request.POST.get('medico_validacao')
        arquivo = request.FILES.get('arquivo_laudo')

        if tipo_id:
            bolsa.tipo_sanguineo_id = tipo_id
        if medico_id:
            bolsa.medico_validacao_id = medico_id
        if arquivo:
            bolsa.arquivo_laudo = arquivo

        if not bolsa.tipo_sanguineo_id or not bolsa.arquivo_laudo or not bolsa.medico_validacao_id:
            return Response(
                {"erro": "Não é possível descartar sem laudo, tipo sanguíneo e médico responsável."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        bolsa.status = STATUS_INAPTO
        bolsa.save() 
        
        return Response(
            {"mensagem": f"Bolsa {bolsa.id} descartada com sucesso."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'])
    def registrar_uso(self, request, pk=None):
        """
        Endpoint customizado para registrar a utilização clínica de uma bolsa.
        Altera o status para 4 (UTILIZADO).
        """
        bolsa = self.get_object()
        STATUS_VALIDADO = 2
        if bolsa.status != STATUS_VALIDADO:
            return Response(
                {"erro": f"Operação negada: O status atual da bolsa ({bolsa.get_status_display()}) não permite uso clínico."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        STATUS_UTILIZADO = 4
        bolsa.status = STATUS_UTILIZADO
        bolsa.save(update_fields=['status'])
        return Response(
            {"mensagem": f"Uso clínico da bolsa {bolsa.id} registrado com sucesso."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['patch'])
    def validar(self, request, pk=None):
        """
        Endpoint customizado para o Médico validar a bolsa.
        Recebe os arquivos e altera o status. A matemática de datas é delegada ao models.py.
        """
        bolsa = self.get_object()
        STATUS_AGUARDANDO = 1
        STATUS_VALIDADO = 2

     
        if bolsa.status != STATUS_AGUARDANDO:
            return Response(
                {"erro": f"Esta bolsa já foi processada. Status atual: {bolsa.get_status_display()}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo_sanguineo_id = request.data.get('tipo_sanguineo')
        arquivo_laudo = request.FILES.get('arquivo_laudo')
        medico_id = request.data.get('medico_validacao')

        if not tipo_sanguineo_id or not arquivo_laudo or not medico_id:
            return Response(
                {"erro": "Tipo sanguíneo, laudo laboratorial e identificação do médico são obrigatórios para validação."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        bolsa.tipo_sanguineo_id = tipo_sanguineo_id
        bolsa.arquivo_laudo = arquivo_laudo
        bolsa.medico_validacao_id = medico_id
        bolsa.status = STATUS_VALIDADO
        
    
        bolsa.save()

        return Response(
            {"mensagem": f"Bolsa {bolsa.id} validada com sucesso!."},
            status=status.HTTP_200_OK
        )
    


    @action(detail=False, methods=['get'])
    def doadores_aptos_carteirinha(self, request):

        dados = (
            Bolsa.objects
            .values(
                'doador',
                'doador__cpf',
                'doador__nome_completo',
                'tipo_sanguineo__tipo',
                'tipo_sanguineo__fator_rh',
                'doador__carteira_doador'
            )
            .annotate(total_bolsas=Count('id'))
            .filter(total_bolsas__gte=3)
            .filter(doador__carteira_doador='')
        )

        resultado = []

        for item in dados:
            tipo = item['tipo_sanguineo__tipo']
            fator = item['tipo_sanguineo__fator_rh']

            resultado.append({
                "doador_id": item['doador'],
                "cpf": item['doador__cpf'],
                "nome": item['doador__nome_completo'],
                "tipo_sanguineo": f"{tipo}{fator}",
                "total_bolsas": item['total_bolsas']
            })

        return Response(resultado)