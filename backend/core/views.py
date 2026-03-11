from rest_framework import viewsets, permissions
from .models import Tipo_Sanguineo
from bolsas.serializers import TipoSanguineoSerializer 

class TipoSanguineoViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = None
    queryset = Tipo_Sanguineo.objects.all()
    serializer_class = TipoSanguineoSerializer
    permission_classes = [permissions.AllowAny] 