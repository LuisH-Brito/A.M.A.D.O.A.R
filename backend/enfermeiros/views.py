from rest_framework import viewsets, status
from rest_framework.decorators import action


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

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        enfermeiro = getattr(request.user, 'enfermeiro', None)
        
        if not enfermeiro:
            return Response({'erro': 'Usuário não é um enfermeiro.'}, status=status.HTTP_404_NOT_FOUND)

        # Se o Angular pedir os dados (GET)
        if request.method == 'GET':
            serializer = self.get_serializer(enfermeiro)
            return Response(serializer.data)

        # Se o Angular quiser salvar/atualizar os dados (PATCH)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(enfermeiro, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    