from rest_framework import serializers
from .models import  Recepcionista


class RecepcionistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recepcionista
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Recepcionista.objects.create_user(**validated_data)
        return user