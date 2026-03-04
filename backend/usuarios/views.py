from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer # Importe o seu serializer

class MyTokenObtainPairView(TokenObtainPairView):
    """
    View de Autenticação customizada baseada em SimpleJWT.
    
    Esta classe substitui a View padrão do JWT para utilizar o 
    MyTokenObtainPairSerializer, permitindo que a resposta do login 
    contenha dados extras como 'nome' e 'tipo' de usuário.
    """
    serializer_class = MyTokenObtainPairSerializer
    """
    Nota de Funcionamento:
    - Quando o Angular faz um POST para esta View com 'cpf' e 'password',
      ela chama o MyTokenObtainPairSerializer.
    - Se as credenciais estiverem corretas, ela retorna um status 200 OK 
      com o Access Token, Refresh Token e os campos customizados.
    """