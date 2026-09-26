from datetime import timedelta
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from choices import StatusProcesso
from doadores.models import Doador
from recepcionistas.models import Recepcionista
from triagem.models import Pergunta, Questionario

from .models import Processo_Doacao


class IniciarProcessoQuestionarioTests(APITestCase):
    def setUp(self):
        self.recepcionista = Recepcionista.objects.create_user(
            cpf='99999999999',
            password='teste',
            email='recepcao@teste.local',
            endereco='Endereço de teste',
            nome_completo='Recepcionista de Teste',
        )
        self.client.force_authenticate(self.recepcionista)
        self.url = reverse('processo-iniciar')
        self.referencia = timezone.now()

    def criar_doador(self, numero):
        return Doador.objects.create_user(
            cpf=f'{numero:011d}',
            password='teste',
            email=f'doador{numero}@teste.local',
            endereco='Endereço de teste',
            nome_completo=f'Doador {numero}',
            sexo='M',
            telefone='68999999999',
        )

    def criar_questionario(self, doador, idade, validade=True):
        questionario = Questionario.objects.create(
            doador=doador,
            validade=validade,
        )
        Questionario.objects.filter(pk=questionario.pk).update(
            data_hora_submissao=self.referencia - idade
        )
        questionario.refresh_from_db()
        return questionario

    def iniciar_processo(self, doador):
        with patch('triagem.models.timezone.now', return_value=self.referencia):
            return self.client.post(self.url, {'cpf': doador.cpf}, format='json')

    def assert_processo_criado_com_questionario(self, resposta, questionario):
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        processo = Processo_Doacao.objects.get(pk=resposta.data['id'])
        self.assertEqual(processo.questionario_id, questionario.id)

    def assert_processo_criado_sem_questionario(self, resposta):
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        processo = Processo_Doacao.objects.get(pk=resposta.data['id'])
        self.assertIsNone(processo.questionario_id)
        return processo

    def test_vincula_questionario_com_23_horas_e_59_minutos(self):
        doador = self.criar_doador(1)
        questionario = self.criar_questionario(
            doador, timedelta(hours=23, minutes=59)
        )

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_com_questionario(resposta, questionario)

    def test_vincula_questionario_exatamente_na_fronteira_de_24_horas(self):
        doador = self.criar_doador(2)
        questionario = self.criar_questionario(doador, timedelta(hours=24))

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_com_questionario(resposta, questionario)

    def test_nao_vincula_questionario_com_24_horas_e_1_minuto(self):
        doador = self.criar_doador(3)
        questionario = self.criar_questionario(
            doador, timedelta(hours=24, minutes=1)
        )

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)
        self.assertTrue(Questionario.objects.filter(pk=questionario.pk).exists())
        questionario.refresh_from_db()
        self.assertFalse(hasattr(questionario, 'processo'))

    def test_nao_vincula_questionario_com_2_dias(self):
        doador = self.criar_doador(4)
        self.criar_questionario(doador, timedelta(days=2))

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_nao_vincula_questionario_com_7_dias(self):
        doador = self.criar_doador(5)
        self.criar_questionario(doador, timedelta(days=7))

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_nao_vincula_questionario_com_30_dias(self):
        doador = self.criar_doador(6)
        self.criar_questionario(doador, timedelta(days=30))

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_inicia_processo_sem_questionario(self):
        doador = self.criar_doador(7)

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_nao_vincula_questionario_inapto_recente(self):
        doador = self.criar_doador(8)
        self.criar_questionario(doador, timedelta(hours=2), validade=False)

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_nao_reutiliza_questionario_ja_vinculado(self):
        doador = self.criar_doador(9)
        questionario = self.criar_questionario(doador, timedelta(hours=2))
        Processo_Doacao.objects.create(
            doador=doador,
            recepcionista=self.recepcionista,
            questionario=questionario,
            status=StatusProcesso.CONCLUIDO,
        )

        resposta = self.iniciar_processo(doador)

        novo_processo = self.assert_processo_criado_sem_questionario(resposta)
        self.assertNotEqual(questionario.processo.id, novo_processo.id)

    def test_vincula_apenas_o_questionario_recente_entre_varios(self):
        doador = self.criar_doador(10)
        self.criar_questionario(doador, timedelta(days=5))
        self.criar_questionario(doador, timedelta(days=2))
        questionario_recente = self.criar_questionario(
            doador, timedelta(hours=12)
        )

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_com_questionario(
            resposta, questionario_recente
        )

    def test_nao_recupera_apto_antigo_quando_recente_e_inapto(self):
        doador = self.criar_doador(11)
        self.criar_questionario(doador, timedelta(days=3), validade=True)
        self.criar_questionario(doador, timedelta(hours=2), validade=False)

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_sem_questionario(resposta)

    def test_questionario_feito_durante_processo_e_criado_e_vinculado(self):
        doador = self.criar_doador(12)
        resposta_inicio = self.iniciar_processo(doador)
        processo = self.assert_processo_criado_sem_questionario(resposta_inicio)
        pergunta = Pergunta.objects.create(
            texto='Pergunta de teste',
            resposta_esperada='Sim',
            motivo_inaptidao='Motivo de teste',
        )

        resposta_questionario = self.client.post(
            reverse('salvar-questionario'),
            {
                'cpf': doador.cpf,
                'processo_id': processo.id,
                'respostas': [{'id': pergunta.id, 'resposta': 'Sim'}],
            },
            format='json',
        )

        self.assertEqual(
            resposta_questionario.status_code, status.HTTP_201_CREATED
        )
        processo.refresh_from_db()
        self.assertIsNotNone(processo.questionario_id)
        self.assertEqual(
            processo.questionario_id,
            resposta_questionario.data['questionario_id'],
        )
