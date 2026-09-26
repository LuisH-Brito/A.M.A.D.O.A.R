from rest_framework import serializers
from .models import Processo_Doacao
from doadores.serializers import DoadorSerializer
from dados_clinicos.serializers import DadosClinicosSerializer


class ProcessoDoacaoSerializer(serializers.ModelSerializer):
    doador = DoadorSerializer(read_only=True)
    dados_clinicos = DadosClinicosSerializer(read_only=True)

    class Meta:
        model = Processo_Doacao
        fields = [
            'id', 'doador', 'status', 'data_inicio', 'recepcionista', 'questionario',
            'dados_clinicos',
        ]
