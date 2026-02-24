from rest_framework import serializers
from .models import Doador

class DoadorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Doador
        fields = [
            'username', 'password', 'email', 'nome_completo', 
            'cpf', 'endereco', 'data_nascimento', 'sexo', 
            'tipo_sanguineo_declarado', 'fator_rh', 'telefone'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')
            
        user = Doador.objects.create_user(**validated_data)
        
        user.set_password(password)
        user.save()
        
        return user