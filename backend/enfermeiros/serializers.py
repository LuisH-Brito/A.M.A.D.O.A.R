from rest_framework import serializers
from .models import Enfermeiro

class EnfermeiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enfermeiro
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Enfermeiro.objects.create_user(**validated_data)
        return user
