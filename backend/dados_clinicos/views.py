from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db import transaction

from .models import Dados_Clinicos, EnfermeiroDados, MedicoDados
from .serializers import DadosClinicosSerializer
from choices import Papel

class DadosClinicosViewSet(viewsets.ModelViewSet):
    queryset = Dados_Clinicos.objects.select_related('processo', 'processo__doador').all()
    serializer_class = DadosClinicosSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            dados_clinicos = serializer.save()
            usuario_logado = request.user
            
            medico = getattr(usuario_logado, 'medico', None)
            enfermeiro = getattr(usuario_logado, 'enfermeiro', None)

            if medico:
                MedicoDados.objects.create(
                    medico=medico,
                    dados=dados_clinicos,
                    papel=Papel.RESPONSAVEL_PRE_TRIAGEM
                )
            elif enfermeiro:
                EnfermeiroDados.objects.create(
                    enfermeiro=enfermeiro,
                    dados=dados_clinicos,
                    papel=Papel.RESPONSAVEL_PRE_TRIAGEM
                )
            else:
                raise ValidationError({"erro": "O usuário autenticado não possui perfil de Médico ou Enfermeiro."})

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)