from rest_framework import serializers
from core.serializers import TipoSanguineoSerializer
from .models import Bolsa
import datetime
from django.utils import timezone



class BolsaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tipo_sanguineo_detalhe = TipoSanguineoSerializer(source='tipo_sanguineo', read_only=True)
    doador_nome = serializers.CharField(source='doador.nome_completo', read_only=True)
    doador_cpf = serializers.CharField(source='doador.cpf', read_only=True)
    doador_email = serializers.EmailField(source='doador.email', read_only=True)
    processo_data_inicio = serializers.DateTimeField(source='processo.data_inicio', read_only=True)
    enfermeiro_nome = serializers.CharField(source='enfermeiro_coleta.nome_completo', read_only=True)
    medico_nome = serializers.CharField(source='medico_validacao.nome_completo', read_only=True)
    estado_temporal = serializers.SerializerMethodField()

    class Meta:
        model = Bolsa
        fields = [
            'id', 'processo', 'doador', 'doador_nome', 'doador_cpf', 'doador_email', 
            'processo_data_inicio',
            'tipo_sanguineo', 'tipo_sanguineo_detalhe', 'enfermeiro_nome', 'enfermeiro_coleta',
            'medico_nome','medico_validacao', 'status', 'status_display', 'data_vencimento', 
            'validacao_at', 'arquivo_laudo', 'estado_temporal'
        ]
    def get_estado_temporal(self, obj):

        if obj.status == 3:
            return "descartada"
        if obj.status == 4:
            return "utilizada"
        if obj.status == 1:
            return "aguardando"
            
        hoje = timezone.now().date()
        if obj.data_vencimento < hoje:
            return "vencida"
        elif obj.data_vencimento <= hoje + datetime.timedelta(days=7):
            return "vencendo"
        return "valida"