from rest_framework import viewsets

from usuarios.permission import EhAdministrador, EhMedico
from .models import Medico
from .serializers import MedicoSerializer
from rest_framework.response import Response

class MedicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para o modelo Medico.
    
    Fornece uma interface completa de API (CRUD) para a entidade Médico, 
    incluindo listagem, criação, visualização detalhada, atualização e exclusão.
    """
    queryset = Medico.objects.all()
    pagination_class = None
    serializer_class = MedicoSerializer
    permission_classes = [EhMedico | EhAdministrador]





