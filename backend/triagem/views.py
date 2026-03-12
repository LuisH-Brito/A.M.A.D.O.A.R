from django.utils import timezone
from datetime import timedelta
from django.db.models import F, Value
from django.db.models.functions import Replace
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Pergunta, Questionario, Resposta
from .serializers import PerguntaSerializer
from doadores.models import Doador


def _somente_digitos(valor: str) -> str:
    return ''.join(ch for ch in (valor or '') if ch.isdigit())


def _buscar_doador_por_cpf_normalizado(cpf: str):
    cpf_numerico = _somente_digitos(cpf)
    if not cpf_numerico:
        return None

    return (
        Doador.objects
        .annotate(
            cpf_numerico=Replace(
                Replace(F('cpf'), Value('.'), Value('')),
                Value('-'),
                Value('')
            )
        )
        .filter(cpf_numerico=cpf_numerico)
        .first()
    )


class PerguntaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pergunta.objects.filter(ativa=True).order_by('id')
    serializer_class = PerguntaSerializer
    pagination_class = None


class SalvarQuestionarioView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = request.data
        processo_id = None

        # verifica se o payload é uma lista ou um dicionário pq depende 
        # se vem pelo processo ou pelo questionário do doador
        if isinstance(payload, list):
            respostas_payload = payload
            cpf_payload = None
        else:
            respostas_payload = payload.get('respostas', [])
            cpf_payload = payload.get('cpf')
            processo_id = payload.get('processo_id') 

        if not respostas_payload:
            return Response(
                {"erro": "Lista de respostas vazia."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prioridade: CPF enviado no body
        if cpf_payload:
            doador = _buscar_doador_por_cpf_normalizado(cpf_payload)
            if not doador:
                return Response(
                    {"erro": "Doador não encontrado para o CPF informado."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Fallback: usuário logado deve ser doador
            doador = getattr(request.user, 'doador', None)
            if not doador:
                return Response(
                    {"erro": "Informe o CPF do doador ou autentique como doador."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calcula validade com base na resposta esperada de cada pergunta
        is_valido = True
        perguntas_cache = {}

        for item in respostas_payload:
            pergunta_id = item.get('id')
            resposta_valor = item.get('resposta')
            if not pergunta_id or resposta_valor is None:
                return Response(
                    {"erro": "Cada item precisa de id e resposta."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pergunta = perguntas_cache.get(pergunta_id)
            if not pergunta:
                try:
                    pergunta = Pergunta.objects.get(id=pergunta_id, ativa=True)
                    perguntas_cache[pergunta_id] = pergunta
                except Pergunta.DoesNotExist:
                    return Response(
                        {"erro": f"Pergunta {pergunta_id} não encontrada/ativa."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if resposta_valor != pergunta.resposta_esperada:
                is_valido = False

        # LÓGICA do VÍNCULO QUESTIONÁRIO <-> PROCESSO DE DOAÇÃO
        questionario_alvo = None
        processo_obj = None

        # Tenta pegar o questionário pelo Processo (Se o médico estiver salvando)
        if processo_id:
            from processos_doacao.models import Processo_Doacao # Importação local para evitar dependência circular
            try:
                processo_obj = Processo_Doacao.objects.get(id=processo_id)
                if processo_obj.questionario:
                    questionario_alvo = processo_obj.questionario
            except Processo_Doacao.DoesNotExist:
                pass

        # Isso ignora se a data virou meia-noite e resolve o bug do fuso horário :(
        if not questionario_alvo:
            limite_tempo = timezone.now() - timedelta(hours=24)
            questionario_alvo = Questionario.objects.filter(
                doador=doador,
                data_hora_submissao__gte=limite_tempo
            ).order_by('-data_hora_submissao').first()

        # 3. Decide se Atualiza ou Cria
        if questionario_alvo:
            print(f"--- DEBUG: Atualizando Questionario Existente ID: {questionario_alvo.id} ---")
            questionario_alvo.validade = is_valido
            questionario_alvo.save()
            questionario = questionario_alvo

            for item in respostas_payload:
                pergunta = perguntas_cache[item.get('id')]
                Resposta.objects.update_or_create(
                    questionario=questionario,
                    pergunta=pergunta,
                    defaults={'resposta_texto': item.get('resposta')}
                )
                
            mensagem_retorno = "Questionário atualizado com sucesso!"
            codigo_status = status.HTTP_200_OK
        else:
            print("--- DEBUG: Nenhum questionário recente. Criando um NOVO! ---")
            questionario = Questionario.objects.create(
                doador=doador,
                validade=is_valido
            )

            for item in respostas_payload:
                pergunta = perguntas_cache[item.get('id')]
                Resposta.objects.create(
                    questionario=questionario,
                    pergunta=pergunta,
                    resposta_texto=item.get('resposta')
                )
                
            mensagem_retorno = "Novo questionário salvo com sucesso!"
            codigo_status = status.HTTP_201_CREATED

        if processo_obj and processo_obj.questionario != questionario:
            processo_obj.questionario = questionario
            processo_obj.save(update_fields=['questionario'])
            print(f"--- DEBUG: Questionário {questionario.id} vinculado ao Processo {processo_obj.id}! ---")

        return Response(
            {
                "mensagem": mensagem_retorno,
                "questionario_id": questionario.id,
                "validade": questionario.validade
            },
            status=codigo_status
        )


class ListarQuestionariosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cpf_buscado = request.query_params.get('cpf')
        if not cpf_buscado:
            return Response(
                {"erro": "CPF não informado na URL"},
                status=status.HTTP_400_BAD_REQUEST
            )

        doador = _buscar_doador_por_cpf_normalizado(cpf_buscado)
        if not doador:
            return Response([], status=status.HTTP_200_OK)

        questionarios = (
            Questionario.objects
            .filter(doador=doador)
            .order_by('-data_hora_submissao')
        )

        resultado_final = []
        for q in questionarios:
            respostas_db = Resposta.objects.filter(questionario=q).select_related('pergunta')
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
                "validade": q.validade,
                "data_hora_submissao": q.data_hora_submissao,
                "respostas": lista_respostas
            })

        return Response(resultado_final, status=status.HTTP_200_OK)