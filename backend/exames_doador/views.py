from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Exame_Doador
from .serializers import ExameDoadorSerializer

class ExameDoadorViewSet(viewsets.ModelViewSet):
    queryset = Exame_Doador.objects.all().order_by('-data_upload')
    serializer_class = ExameDoadorSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 


    def get_queryset(self):
        queryset = super().get_queryset()
        doador_id = self.request.query_params.get('doador')
        if doador_id:
            queryset = queryset.filter(doador_id=doador_id)
        if hasattr(self.request.user, 'doador'):
            queryset = queryset.filter(doador=self.request.user.doador)
            
        return queryset