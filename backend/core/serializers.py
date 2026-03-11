from rest_framework import serializers
from core.models import Tipo_Sanguineo

class TipoSanguineoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipo_Sanguineo
        fields = ['id', 'tipo', 'fator_rh']