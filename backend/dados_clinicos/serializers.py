from rest_framework import serializers
from .models import Dados_Clinicos
from processos_doacao.models import Processo_Doacao


class DadosClinicosSerializer(serializers.ModelSerializer):
    processo_id = serializers.IntegerField(write_only=True)
    processo = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Dados_Clinicos
        fields = [
            'id',
            'processo',
            'processo_id',
            'peso',
            'altura',
            'hemoglobina',
            'pressao_arterial',
            'status_clinico',
        ]

    def create(self, validated_data):
        processo_id = validated_data.pop('processo_id')
        try:
            processo = Processo_Doacao.objects.get(id=processo_id)
        except Processo_Doacao.DoesNotExist:
            raise serializers.ValidationError({'processo_id': 'Processo não encontrado.'})

        if Dados_Clinicos.objects.filter(processo=processo).exists():
            raise serializers.ValidationError({'processo_id': 'Esse processo já possui dados clínicos.'})

        return Dados_Clinicos.objects.create(processo=processo, **validated_data)