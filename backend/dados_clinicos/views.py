from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction

from .models import Dados_Clinicos, EnfermeiroDados
from .serializers import DadosClinicosSerializer
from enfermeiros.models import Enfermeiro 
from choices import Papel


class DadosClinicosViewSet(viewsets.ModelViewSet):
    queryset = Dados_Clinicos.objects.select_related('processo', 'processo__doador').all()
    serializer_class = DadosClinicosSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Intercepta a criação dos Dados Clínicos para registrar a Auditoria da Pré-Triagem.
        """
        enfermeiro_id = request.data.get('enfermeiro_id')

        
        with transaction.atomic():
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            dados_clinicos = serializer.save()

           
            if enfermeiro_id:
                try:
                    enfermeiro = Enfermeiro.objects.get(id=enfermeiro_id)
                    EnfermeiroDados.objects.create(
                        enfermeiro=enfermeiro,
                        dados=dados_clinicos,
                        papel=Papel.RESPONSAVEL_PRE_TRIAGEM
                    )
                except Enfermeiro.DoesNotExist:
                 
                    return Response(
                        {"erro": "Enfermeiro responsável não encontrado no banco de dados."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)