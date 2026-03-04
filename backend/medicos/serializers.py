from rest_framework import serializers
from .models import Medico

class MedicoSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Medico.
    Converte instâncias do modelo Medico em JSON e vice-versa, gerenciando
    a validação de dados e a segurança da senha do usuário.
    """
    class Meta:
        model = Medico
        fields = [
            'id', 'cpf', 'nome_completo', 'email', 
            'endereco', 'data_nascimento', 'crm', 'is_active'
        ]
        extra_kwargs = {'password': {'write_only': True}}


    def create(self, validated_data):
        """
        Sobrescreve a criação padrão para garantir a criptografia da senha.
        Utiliza o método create_user do Manager do modelo Medico, que é
        responsável por transformar a senha em um hash seguro.
        """
        user = Medico.objects.create_user(**validated_data)
        return user
    
    def update(self, instance, validated_data):
        """
        Sobrescreve a atualização para tratar alterações de senha de forma segura.
        
        Lógica:
        1. Remove a senha dos dados validados (pop) para evitar salvamento em texto puro.
        2. Se uma nova senha existir, utiliza set_password() para criptografá-la.
        3. Chama o método update da classe pai para salvar os demais campos.
        """
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        return super().update(instance, validated_data)