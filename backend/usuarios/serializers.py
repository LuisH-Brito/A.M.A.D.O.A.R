import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.utils import get_md5_hash_password
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

class UsuarioNormalizacaoMixin:
    def to_internal_value(self, data):
        dados = data.copy()

        cpf = dados.get('cpf')
        if cpf:
            if not re.fullmatch(
                r'\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2}',
                cpf,
            ):
                raise serializers.ValidationError({
                    'cpf': 'Formato de CPF inválido.'
                })

            dados['cpf'] = re.sub(r'\D', '', cpf)

        email = dados.get('email')
        if email:
            dados['email'] = email.strip().lower()

        return super().to_internal_value(dados)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer customizado para a obtenção de tokens JWT (SimpleJWT).
    
    Esta classe estende o comportamento padrão para incluir informações 
    adicionais do perfil do usuário tanto no Payload (dentro do token) 
    quanto no corpo da resposta JSON (fora do token).
    """
    @classmethod
    def get_token(cls, user):
        """
        Customiza o conteúdo (Payload) do Refresh e Access Token.
        
        As informações inseridas aqui ficam 'encriptadas' no Base64 do token
        e podem ser lidas pelo Frontend ou verificadas pelo Backend.
        """
        token = super().get_token(user)

        token['nome'] = user.nome_completo
        token['cpf'] = user.cpf
        
        if hasattr(user, 'enfermeiro'):
            token['tipo'] = 'enfermeiro'
        elif hasattr(user, 'medico'):
            token['tipo'] = 'medico'
        elif hasattr(user, 'recepcionista'):
            token['tipo'] = 'recepcionista'
        elif hasattr(user, 'administrador'):
            token['tipo'] = 'administrador'
        elif hasattr(user, 'doador'):
            token['tipo'] = 'doador'
        else:
            token['tipo'] = 'comum'

        return token

    def validate(self, attrs):
        """
        Customiza o JSON retornado no corpo da resposta HTTP (endpoint de login).
        
        Enquanto o 'get_token' altera o que está DENTRO do token, este método 
        altera o que o Angular recebe DIRETAMENTE no objeto de resposta (res).
        """
        data = super().validate(attrs)
        
        user = self.user

        data['usuario_id'] = user.id
        
        if hasattr(user, 'enfermeiro'):
            data['tipo'] = 'enfermeiro'
        elif hasattr(user, 'medico'):
            data['tipo'] = 'medico'
        elif hasattr(user, 'recepcionista'):
            data['tipo'] = 'recepcionista'
        elif hasattr(user, 'administrador'):
            data['tipo'] = 'administrador'
        elif hasattr(user, 'doador'):
            data['tipo'] = 'doador'
        else:
            data['tipo'] = 'comum'
            
        data['nome'] = user.nome_completo
        data['deve_alterar_senha'] = user.deve_alterar_senha
        
        return data


class RevocableTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs['refresh'])
        user = get_user_model().objects.filter(
            pk=refresh.get(api_settings.USER_ID_CLAIM)
        ).first()
        if not user or refresh.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(user.password):
            raise AuthenticationFailed('Sessão expirada após alteração de senha.')
        return super().validate(attrs)
