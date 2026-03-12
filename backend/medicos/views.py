from rest_framework.decorators import action
from rest_framework import viewsets, status

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

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        medico = getattr(request.user, 'medico', None)
        
        if not medico:
            return Response({'erro': 'Usuário não é um médico.'}, status=status.HTTP_404_NOT_FOUND)

        # Se o Angular pedir os dados (GET)
        if request.method == 'GET':
            serializer = self.get_serializer(medico)
            return Response(serializer.data)

        # Se o Angular quiser salvar/atualizar os dados (PATCH)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(medico, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





