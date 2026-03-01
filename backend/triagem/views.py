from rest_framework import viewsets, status
from rest_framework.views import APIView  
from rest_framework.response import Response
from .models import Pergunta, Questionario, Resposta
from .serializers import PerguntaSerializer
from doadores.models import Doador

class PerguntaViewSet(viewsets.ReadOnlyModelViewSet):
    #get 
    queryset = Pergunta.objects.filter(ativa=True).order_by('id') 
    serializer_class = PerguntaSerializer

class SalvarQuestionarioView(APIView):
    def post(self, request):
        dados = request.data 

        #como ainda nao tem um login funcional usaremos o primeiro usuario do banco para teste
        doador_teste = Doador.objects.filter(cpf="teste").first()
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
    
class ListarQuestionariosView(APIView):
    def get(self, request):
        cpf_buscado = request.query_params.get('cpf')
        
        if not cpf_buscado:
            return Response({"erro": "CPF não informado na URL"}, status=status.HTTP_400_BAD_REQUEST)
            
        questionarios = Questionario.objects.filter(doador__cpf=cpf_buscado).order_by('-data_hora_submissao')
        
        resultado_final = []
        
        for q in questionarios:
            respostas_db = Resposta.objects.filter(questionario=q)
            lista_respostas = []
            
            for r in respostas_db:
                lista_respostas.append({
                    "pergunta_texto": r.pergunta.texto,
                    "resposta_dada": r.resposta_texto,
                    "resposta_esperada": r.pergunta.resposta_esperada,
                    "motivo_inaptidao": r.pergunta.motivo_inaptidao
                })
                
            resultado_final.append({
                "id": q.id,
                "data_hora_submissao": q.data_hora_submissao,
                "respostas": lista_respostas
            })
            
        return Response(resultado_final, status=status.HTTP_200_OK)