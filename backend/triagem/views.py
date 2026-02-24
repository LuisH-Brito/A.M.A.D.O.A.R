from rest_framework import viewsets, status
from rest_framework.views import APIView  
from rest_framework.response import Response
from .models import Pergunta, Questionario, Resposta
from .serializers import PerguntaSerializer

class PerguntaViewSet(viewsets.ReadOnlyModelViewSet):
    #get 
    queryset = Pergunta.objects.filter(ativa=True).order_by('id') 
    serializer_class = PerguntaSerializer

class SalvarQuestionarioView(APIView):
    def post(self, request):
        dados = request.data 

        #como ainda nao tem um login funcional usaremos o primeiro usuario do banco para teste
        from doadores.models import Doador 
        doador_teste = Doador.objects.first()
        if not doador_teste:
            return Response({"erro": "Crie pelo menos um doador no Admin para testar!"}, status=status.HTTP_400_BAD_REQUEST)

        questionario = Questionario.objects.create(doador=doador_teste)

        for item in dados:
            pergunta_id = item.get('id')
            resposta_valor = item.get('resposta')

            if resposta_valor: 
                pergunta = Pergunta.objects.get(id=pergunta_id)
                Resposta.objects.create(
                    questionario=questionario,
                    pergunta=pergunta,
                    resposta_texto=resposta_valor
                )

        return Response({"mensagem": "Questionário salvo com sucesso!"}, status=status.HTTP_201_CREATED)