from rest_framework import viewsets
from .models import  Recepcionista
from .serializers import  RecepcionistaSerializer


class RecepcionistaViewSet(viewsets.ModelViewSet):
    queryset = Recepcionista.objects.all()
    serializer_class = RecepcionistaSerializer