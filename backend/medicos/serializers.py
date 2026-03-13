import re
from rest_framework import serializers
from .models import Medico


def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and bool(re.search(r'[a-z]', senha))
        and bool(re.search(r'[A-Z]', senha))
        and bool(re.search(r'\d', senha))
    )


class MedicoSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Medico.
    Converte instâncias do modelo Medico em JSON e vice-versa, gerenciando
    a validação de dados e a segurança da senha do usuário.
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Medico
        fields = [
            'id', 'cpf', 'nome_completo', 'email',
            'endereco', 'data_nascimento', 'crm', 'is_active', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def validate_password(self, value):
        if not senha_forte(value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'
            )
        return value

    def create(self, validated_data):
        """
        Sobrescreve a criação padrão para garantir a criptografia da senha.
        Utiliza o método create_user do Manager do modelo Medico, que é
        responsável por transformar a senha em um hash seguro.
        """
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Senha é obrigatória.'})

        user = Medico.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        """
        Sobrescreve a atualização para tratar alterações de senha de forma segura.
        """
        password = validated_data.pop('password', None)
        if password:
            if not senha_forte(password):
                raise serializers.ValidationError(
                    {'password': 'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'}
                )
            instance.set_password(password)

        return super().update(instance, validated_data)