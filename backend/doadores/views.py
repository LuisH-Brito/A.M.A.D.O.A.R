from rest_framework import viewsets
from .models import Doador
from .serializers import DoadorSerializer

class DoadorViewSet(viewsets.ModelViewSet):
    queryset = Doador.objects.all()
    serializer_class = DoadorSerializer