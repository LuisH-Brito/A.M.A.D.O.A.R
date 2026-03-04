from django.shortcuts import render
from rest_framework import viewsets
from administradores.models import Administrador
from administradores.serializers import AdministradorSerializer
from usuarios.permission import EhAdministrador, EhSuperAdmin

# Create your views here
class AdministradorViewSet(viewsets.ModelViewSet):
    queryset = Administrador.objects.all()
    serializer_class = AdministradorSerializer
    permission_classes = [EhAdministrador & EhSuperAdmin]