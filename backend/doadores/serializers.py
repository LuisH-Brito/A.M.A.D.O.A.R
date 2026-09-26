import re
from rest_framework import serializers
from .models import Doador
from django.utils import timezone
from usuarios.serializers import UsuarioNormalizacaoMixin

def senha_forte(senha: str) -> bool:
    senha = (senha or '').strip()
    return (
        len(senha) >= 8
        and re.search(r'[a-z]', senha)
        and re.search(r'[A-Z]', senha)
        and re.search(r'\d', senha)
    )

class DoadorSerializer(
    UsuarioNormalizacaoMixin,
    serializers.ModelSerializer,
):
    password = serializers.CharField(write_only=True, required=False)
    apto_para_doacao = serializers.ReadOnlyField()
    data_proxima_doacao = serializers.ReadOnlyField()
    data_ultima_doacao = serializers.ReadOnlyField()
    
    class Meta:
        model = Doador
        fields = [
            'password', 'email', 'nome_completo', 
            'cpf', 'endereco', 'data_nascimento', 'sexo', 
            'tipo_sanguineo_declarado', 'fator_rh', 'telefone', 'carteira_doador',
            'apto_para_doacao', 'data_proxima_doacao', 'data_ultima_doacao'
        ]

    def validate_cpf(self, value):
        if not re.fullmatch(
            r'\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}',
            value or '',
        ):
            raise serializers.ValidationError('Formato de CPF inválido.')

        numeros = ''.join(char for char in value if char.isdigit())

        if len(set(numeros)) == 1:
            raise serializers.ValidationError('CPF inválido.')

        def calcular_digito(base, peso_inicial):
            soma = sum(
                int(numero) * (peso_inicial - indice)
                for indice, numero in enumerate(base)
            )
            resto = soma % 11
            return 0 if resto < 2 else 11 - resto

        if calcular_digito(numeros[:9], 10) != int(numeros[9]):
            raise serializers.ValidationError('CPF inválido.')

        if calcular_digito(numeros[:10], 11) != int(numeros[10]):
            raise serializers.ValidationError('CPF inválido.')

        return numeros

    def validate_data_nascimento(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                'A data de nascimento não pode ser futura.'
            )
        return value

    def validate_password(self, value):
        if not senha_forte(value):
            raise serializers.ValidationError(
                'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'
            )
        return value

    def validate_telefone(self, value):
        if not re.fullmatch(
            r'\d{10,11}|\(\d{2}\) \d{4,5}-\d{4}',
            value or '',
        ):
            raise serializers.ValidationError('Formato de telefone inválido.')

        numeros = ''.join(char for char in value if char.isdigit())
        ddd = int(numeros[:2])
        numero = numeros[2:]

        if ddd < 11 or ddd > 99 or set(numero) == {'0'}:
            raise serializers.ValidationError('Telefone inválido.')

        if len(numero) == 9 and not numero.startswith('9'):
            raise serializers.ValidationError('Celular inválido.')

        if len(numero) == 8 and numero[0] not in '2345':
            raise serializers.ValidationError('Telefone fixo inválido.')

        return numeros

    def create(self, validated_data):
        password = validated_data.pop('password')

        if not validated_data.get('cpf'):
            validated_data['cpf'] = validated_data.get('email')

        user = Doador.objects.create_user(**validated_data)

        user.set_password(password)
        user.save()

        return user