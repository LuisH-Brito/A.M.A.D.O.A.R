from administradores.models import Administrador
from doadores import serializers


class AdministradorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administrador
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = Administrador.objects.create_user(**validated_data)
        return user