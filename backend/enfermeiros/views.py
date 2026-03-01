from rest_framework import viewsets
from .models import  Enfermeiro
from .serializers import  EnfermeiroSerializer



class EnfermeiroViewSet(viewsets.ModelViewSet):
    queryset = Enfermeiro.objects.all()
    serializer_class = EnfermeiroSerializer

