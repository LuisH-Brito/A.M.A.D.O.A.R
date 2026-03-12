from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response


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

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        recepcionista = getattr(request.user, 'recepcionista', None)
        
        if not recepcionista:
            return Response({'erro': 'Usuário não é um recepcionista.'}, status=status.HTTP_404_NOT_FOUND)

        # Se o Angular pedir os dados (GET)
        if request.method == 'GET':
            serializer = self.get_serializer(recepcionista)
            return Response(serializer.data)

        # Se o Angular quiser salvar/atualizar os dados (PATCH)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(recepcionista, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    