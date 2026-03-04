from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
        
        return data