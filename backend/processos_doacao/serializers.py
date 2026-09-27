from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone
from .models import Processo_Doacao
from doadores.serializers import DoadorSerializer
from dados_clinicos.serializers import DadosClinicosSerializer


class ProcessoDoacaoSerializer(serializers.ModelSerializer):
    doador = DoadorSerializer(read_only=True)
    dados_clinicos = DadosClinicosSerializer(read_only=True)
    em_andamento = serializers.SerializerMethodField()

    def get_em_andamento(self, processo):
        return (
            processo.atendimento_usuario_id is not None
            and processo.atendimento_atualizado_em is not None
            and processo.atendimento_atualizado_em >= timezone.now() - timedelta(seconds=15)
        )

    class Meta:
        model = Processo_Doacao
        fields = [
            'id', 'doador', 'status', 'data_inicio', 'recepcionista', 'questionario',
            'dados_clinicos', 'em_andamento',
        ]
