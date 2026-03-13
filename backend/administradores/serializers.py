import re
from rest_framework import serializers
from administradores.models import Administrador


def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and bool(re.search(r'[a-z]', senha))
        and bool(re.search(r'[A-Z]', senha))
        and bool(re.search(r'\d', senha))
    )


class AdministradorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Administrador
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def validate_password(self, value):
        if not senha_forte(value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Senha é obrigatória.'})

        user = Administrador.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            if not senha_forte(password):
                raise serializers.ValidationError(
                    {'password': 'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'}
                )
            instance.set_password(password)

        return super().update(instance, validated_data)