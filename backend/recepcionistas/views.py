from rest_framework import viewsets

from usuarios.permission import EhRecepcionista, EhAdministrador
from .models import  Recepcionista
from .serializers import  RecepcionistaSerializer


class RecepcionistaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para o modelo Recepcionista.
    
    Centraliza a lógica de API (CRUD) para a entidade Recepcionista,
    permitindo listar, criar, visualizar, atualizar e remover registros
    de funcionários da recepção.
    """
    queryset = Recepcionista.objects.all()
    pagination_class = None
    serializer_class = RecepcionistaSerializer
    permission_classes = [EhRecepcionista | EhAdministrador]
    