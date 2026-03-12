from rest_framework import serializers
from .models import Doador

class DoadorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Doador
        fields = [
            'password', 'email', 'nome_completo', 
            'cpf', 'endereco', 'data_nascimento', 'sexo', 
            'tipo_sanguineo_declarado', 'fator_rh', 'telefone', 'carteira_doador'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        if not validated_data.get('cpf'):
            validated_data['cpf'] = validated_data.get('email')
            
        user = Doador.objects.create_user(**validated_data)
        
        user.set_password(password)
        user.save()
        
        return user