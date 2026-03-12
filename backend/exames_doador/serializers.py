from rest_framework import serializers
from .models import Exame_Doador

class ExameDoadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exame_Doador
        fields = '__all__'