# backend/triagem/serializers.py
from rest_framework import serializers
from .models import Pergunta

class PerguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pergunta
        fields = ['id', 'texto', 'resposta_esperada', 'motivo_inaptidao', 'ativa']