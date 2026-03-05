from rest_framework import viewsets

from usuarios.permission import EhEnfermeiro, EhAdministrador
from .models import  Enfermeiro
from .serializers import  EnfermeiroSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response


class EnfermeiroViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciamento completo (CRUD) de instâncias do modelo Enfermeiro.
    
    Fornece automaticamente as ações: list, create, retrieve, update, partial_update e destroy.
    Integra-se com o EnfermeiroSerializer para garantir o tratamento correto de senhas.
    """
    queryset = Enfermeiro.objects.all()
    pagination_class = None
    serializer_class = EnfermeiroSerializer
    permission_classes = [IsAuthenticated & (EhEnfermeiro | EhAdministrador)]
    