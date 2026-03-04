from rest_framework import serializers
from .models import  Recepcionista


class RecepcionistaSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Recepcionista.
    Gerencia a conversão de dados entre o Banco de Dados e o JSON da API,
    além de garantir que o cadastro e edição de recepcionistas sigam
    as normas de segurança de senha do Django.
    """
    class Meta:
        model = Recepcionista
        fields = [
            'id', 'cpf', 'nome_completo', 'email', 
            'endereco', 'data_nascimento', 'is_active'
        ]
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def update(self, instance, validated_data):
        """
        Personaliza o processo de atualização (PUT/PATCH).
        
        Garante que, se uma nova senha for fornecida, ela seja criptografada 
        antes de salvar. Caso contrário, a senha atual permanece inalterada.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

    def create(self, validated_data):
        """
        Personaliza o processo de criação (POST).
        
        Utiliza o método 'create_user' definido no Manager do modelo,
        assegurando que o registro seja criado com a criptografia 
        padrão do Django (PBKDF2 por padrão).
        """
        user = Recepcionista.objects.create_user(**validated_data)
        return user