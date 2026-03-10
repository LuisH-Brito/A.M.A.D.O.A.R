from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Dados_Clinicos
from .serializers import DadosClinicosSerializer


class DadosClinicosViewSet(viewsets.ModelViewSet):
    queryset = Dados_Clinicos.objects.select_related('processo', 'processo__doador').all()
    serializer_class = DadosClinicosSerializer
    permission_classes = [permissions.AllowAny]
