from rest_framework import serializers
from decimal import Decimal
from math import isfinite

from choices import StatusClinico
from .models import Dados_Clinicos
from .limites import (
    ALTURA_MAX_M,
    HEMOGLOBINA_MAX_APTO_G_DL,
    HEMOGLOBINA_MAX_MEDICAO_G_DL,
    HEMOGLOBINA_MIN_APTO_G_DL,
    PESO_MAX_MEDICAO_KG,
    PESO_MIN_DOACAO_KG,
)
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

    def validate(self, attrs):
        processo_id = attrs.get('processo_id')
        if self.instance and processo_id is not None:
            if processo_id != self.instance.processo_id:
                raise serializers.ValidationError({
                    'processo_id': 'Não é possível alterar o processo dos dados clínicos.'
                })
            attrs.pop('processo_id')
        processo = self.instance.processo if self.instance else Processo_Doacao.objects.filter(
            pk=processo_id
        ).select_related('doador').first()
        if not processo:
            raise serializers.ValidationError({'processo_id': 'Processo não encontrado.'})

        altura = attrs.get('altura', getattr(self.instance, 'altura', None))
        peso = attrs.get('peso', getattr(self.instance, 'peso', None))
        hemoglobina = attrs.get(
            'hemoglobina', getattr(self.instance, 'hemoglobina', None)
        )
        status_clinico = attrs.get(
            'status_clinico',
            getattr(self.instance, 'status_clinico', StatusClinico.INAPTO),
        )
        erros = {}

        def medicao_valida(valor, maximo, casas):
            return (
                valor is not None
                and isfinite(valor)
                and 0 < valor <= maximo
                and Decimal(str(valor)).as_tuple().exponent >= -casas
            )

        if not medicao_valida(altura, ALTURA_MAX_M, 2):
            erros['altura'] = 'Informe uma altura maior que 0 e de até 3,00 m, com até duas casas decimais.'
        if not medicao_valida(peso, PESO_MAX_MEDICAO_KG, 1):
            erros['peso'] = f'Informe um peso maior que 0 e de até {PESO_MAX_MEDICAO_KG:g} kg, com uma casa decimal.'
        if not medicao_valida(hemoglobina, HEMOGLOBINA_MAX_MEDICAO_G_DL, 1):
            erros['hemoglobina'] = 'Informe um valor de hemoglobina válido em g/dL, com uma casa decimal.'

        if not erros and status_clinico == StatusClinico.APTO:
            if peso < PESO_MIN_DOACAO_KG:
                erros['peso'] = 'O peso mínimo para aptidão é 50 kg.'

            sexo = processo.doador.sexo
            minimo_hemoglobina = HEMOGLOBINA_MIN_APTO_G_DL.get(sexo)
            if minimo_hemoglobina is None:
                erros['hemoglobina'] = 'Sexo do doador inválido para avaliar a hemoglobina.'
            elif hemoglobina < minimo_hemoglobina:
                erros['hemoglobina'] = (
                    f'A hemoglobina mínima para aptidão é {minimo_hemoglobina:.1f} g/dL.'
                )
            elif hemoglobina >= HEMOGLOBINA_MAX_APTO_G_DL:
                erros['hemoglobina'] = (
                    'Hemoglobina igual ou superior a 18,0 g/dL impede a classificação como apto.'
                )

        if erros:
            raise serializers.ValidationError(erros)
        return attrs

    def create(self, validated_data):
        processo_id = validated_data.pop('processo_id')
        try:
            processo = Processo_Doacao.objects.get(id=processo_id)
        except Processo_Doacao.DoesNotExist:
            raise serializers.ValidationError({'processo_id': 'Processo não encontrado.'})

        if Dados_Clinicos.objects.filter(processo=processo).exists():
            raise serializers.ValidationError({'processo_id': 'Esse processo já possui dados clínicos.'})

        return Dados_Clinicos.objects.create(processo=processo, **validated_data)
