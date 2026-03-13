import re
from rest_framework import serializers
from .models import Enfermeiro


def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and bool(re.search(r'[a-z]', senha))
        and bool(re.search(r'[A-Z]', senha))
        and bool(re.search(r'\d', senha))
    )


class EnfermeiroSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Enfermeiro.
    Responsável por validar os dados de entrada, transformar instâncias do modelo
    em JSON e gerenciar a criação/atualização segura de usuários.
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Enfermeiro
        fields = [
            'id', 'cpf', 'nome_completo', 'email',
            'endereco', 'data_nascimento', 'coren', 'is_active', 'password'
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
        Sobrescreve o método de atualização para tratar a alteração de senha.
        Se uma nova senha for enviada, ela é criptografada antes de salvar.
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
        Sobrescreve o método de criação para garantir o uso do create_user.
        Isso é vital para que a senha não seja salva em texto plano no banco de dados.
        """
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Senha é obrigatória.'})

        user = Enfermeiro.objects.create_user(password=password, **validated_data)
        return user
