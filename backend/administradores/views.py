from django.shortcuts import render
from requests import Response
from rest_framework.decorators import action


from rest_framework import viewsets, status
from administradores.models import Administrador
from administradores.serializers import AdministradorSerializer
from usuarios.permission import EhAdministrador, EhSuperAdmin

# Create your views here
class AdministradorViewSet(viewsets.ModelViewSet):
    queryset = Administrador.objects.all()
    serializer_class = AdministradorSerializer
    permission_classes = [EhAdministrador & EhSuperAdmin]

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
