import re
from rest_framework import serializers
from .models import Recepcionista


def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and bool(re.search(r'[a-z]', senha))
        and bool(re.search(r'[A-Z]', senha))
        and bool(re.search(r'\d', senha))
    )


class RecepcionistaSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Recepcionista.
    Gerencia a conversão de dados entre o Banco de Dados e o JSON da API,
    além de garantir que o cadastro e edição de recepcionistas sigam
    as normas de segurança de senha do Django.
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Recepcionista
        fields = [
            'id', 'cpf', 'nome_completo', 'email',
            'endereco', 'data_nascimento', 'is_active', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def validate_password(self, value):
        if not senha_forte(value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'
            )
        return value

    def update(self, instance, validated_data):
        """
        Personaliza o processo de atualização (PUT/PATCH).
        """
        password = validated_data.pop('password', None)
        if password:
            if not senha_forte(password):
                raise serializers.ValidationError(
                    {'password': 'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'}
                )
            instance.set_password(password)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        """
        Personaliza o processo de criação (POST).
        """
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Senha é obrigatória.'})

        user = Recepcionista.objects.create_user(password=password, **validated_data)
        return user