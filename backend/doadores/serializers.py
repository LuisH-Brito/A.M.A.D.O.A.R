import re
from rest_framework import serializers
from .models import Doador


def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and re.search(r'[a-z]', senha)
        and re.search(r'[A-Z]', senha)
        and re.search(r'\d', senha)
    )


class DoadorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Doador
        fields = [
            'password', 'email', 'nome_completo',
            'cpf', 'endereco', 'data_nascimento', 'sexo',
            'tipo_sanguineo_declarado', 'fator_rh', 'telefone', 'carteira_doador'
        ]

    def validate_password(self, value):
        if not senha_forte(value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')

        if not validated_data.get('cpf'):
            validated_data['cpf'] = validated_data.get('email')

        user = Doador.objects.create_user(**validated_data)

        user.set_password(password)
        user.save()

        return user