from rest_framework import serializers
from .models import Enfermeiro

class EnfermeiroSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Enfermeiro.
    Responsável por validar os dados de entrada, transformar instâncias do modelo 
    em JSON e gerenciar a criação/atualização segura de usuários.
    """
    class Meta:
        model = Enfermeiro
        fields = [
            'id', 'cpf', 'nome_completo', 'email', 
            'endereco', 'data_nascimento', 'coren', 'is_active', 'password'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def update(self, instance, validated_data):
        """
        Sobrescreve o método de atualização para tratar a alteração de senha.
        Se uma nova senha for enviada, ela é criptografada antes de salvar.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
    
    def create(self, validated_data):
        """
        Sobrescreve o método de criação para garantir o uso do create_user.
        Isso é vital para que a senha não seja salva em texto plano no banco de dados.
        """
        user = Enfermeiro.objects.create_user(**validated_data)
        return user
