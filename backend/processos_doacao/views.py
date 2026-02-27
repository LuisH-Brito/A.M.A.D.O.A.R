from rest_framework import viewsets, permissions

from .models import Processo_Doacao
from .serializers import ProcessoDoacaoSerializer


class ProcessoDoacaoViewSet(viewsets.ReadOnlyModelViewSet):
	"""API endpoint that allows processsos de doação to be viewed."""
	queryset = Processo_Doacao.objects.select_related('doador').all()
	serializer_class = ProcessoDoacaoSerializer
	permission_classes = [permissions.AllowAny]
