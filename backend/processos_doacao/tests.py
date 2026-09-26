from datetime import timedelta
from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from choices import StatusClinico, StatusProcesso
from dados_clinicos.models import Dados_Clinicos
from doadores.models import Doador
from medicos.models import Medico
from recepcionistas.models import Recepcionista
from triagem.models import Pergunta, Questionario, Resposta

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

    def test_vincula_questionario_inapto_recente_para_revisao_medica(self):
        doador = self.criar_doador(8)
        questionario = self.criar_questionario(
            doador, timedelta(hours=2), validade=False
        )

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_com_questionario(resposta, questionario)

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

    def test_vincula_questionario_recente_inapto_em_vez_do_apto_antigo(self):
        doador = self.criar_doador(11)
        self.criar_questionario(doador, timedelta(days=3), validade=True)
        questionario_recente = self.criar_questionario(
            doador, timedelta(hours=2), validade=False
        )

        resposta = self.iniciar_processo(doador)

        self.assert_processo_criado_com_questionario(
            resposta, questionario_recente
        )

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


class DecidirTriagemQuestionarioTests(APITestCase):
    def setUp(self):
        self.medico = Medico.objects.create_user(
            cpf='81111111111',
            password='teste',
            email='medico-triagem@teste.local',
            endereco='Endereço de teste',
            nome_completo='Médico de Teste',
            crm='CRM-AC-8111',
        )
        self.recepcionista = Recepcionista.objects.create_user(
            cpf='82222222222',
            password='teste',
            email='recepcao-triagem@teste.local',
            endereco='Endereço de teste',
            nome_completo='Recepcionista de Teste',
        )
        self.doador = Doador.objects.create_user(
            cpf='83333333333',
            password='teste',
            email='doador-triagem@teste.local',
            endereco='Endereço de teste',
            nome_completo='Doador de Teste',
            sexo='M',
            telefone='68999999999',
        )
        self.pergunta = Pergunta.objects.create(
            texto='Pergunta impeditiva de teste',
            resposta_esperada='Não',
            motivo_inaptidao='Condição impeditiva de teste',
        )
        self.client.force_authenticate(self.medico)

    def criar_processo(self, validade):
        questionario = Questionario.objects.create(
            doador=self.doador,
            validade=validade,
        )
        Resposta.objects.create(
            questionario=questionario,
            pergunta=self.pergunta,
            resposta_texto='Não' if validade else 'Sim',
        )
        processo = Processo_Doacao.objects.create(
            doador=self.doador,
            recepcionista=self.recepcionista,
            questionario=questionario,
            status=StatusProcesso.TRIAGEM,
        )
        return processo

    def decidir(self, processo, aprovado):
        return self.client.post(
            reverse('processo-decidir-triagem', kwargs={'pk': processo.pk}),
            {
                'pressao_arterial': '120x80',
                'aprovado': aprovado,
                'medico_id': self.medico.pk,
            },
            format='json',
        )

    def test_aceita_apto_quando_questionario_permite_aptidao(self):
        processo = self.criar_processo(validade=True)

        resposta = self.decidir(processo, aprovado=True)

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(
            processo.dados_clinicos.status_clinico,
            StatusClinico.APTO,
        )

    def test_rejeita_apto_quando_questionario_e_impeditivo(self):
        processo = self.criar_processo(validade=False)

        resposta = self.decidir(processo, aprovado=True)

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incompatíveis', resposta.data['erro'])
        self.assertFalse(
            Dados_Clinicos.objects.filter(processo=processo).exists()
        )

    def test_aceita_inapto_quando_questionario_e_impeditivo(self):
        processo = self.criar_processo(validade=False)

        resposta = self.decidir(processo, aprovado=False)

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(
            processo.dados_clinicos.status_clinico,
            StatusClinico.INAPTO,
        )

    def test_questionario_presencial_impeditivo_e_vinculado_e_bloqueia_apto(self):
        processo = Processo_Doacao.objects.create(
            doador=self.doador,
            recepcionista=self.recepcionista,
            status=StatusProcesso.TRIAGEM,
        )

        resposta_questionario = self.client.post(
            reverse('salvar-questionario'),
            {
                'cpf': self.doador.cpf,
                'processo_id': processo.pk,
                'respostas': [{'id': self.pergunta.pk, 'resposta': 'Sim'}],
            },
            format='json',
        )
        processo.refresh_from_db()
        resposta_decisao = self.decidir(processo, aprovado=True)

        self.assertEqual(
            resposta_questionario.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            processo.questionario_id,
            resposta_questionario.data['questionario_id'],
        )
        self.assertFalse(processo.questionario.validade)
        self.assertEqual(
            resposta_decisao.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_questionario_online_impeditivo_e_vinculado_e_bloqueia_apto(self):
        questionario = Questionario.objects.create(
            doador=self.doador,
            validade=False,
        )
        Resposta.objects.create(
            questionario=questionario,
            pergunta=self.pergunta,
            resposta_texto='Sim',
        )
        self.client.force_authenticate(self.recepcionista)

        resposta_inicio = self.client.post(
            reverse('processo-iniciar'),
            {'cpf': self.doador.cpf},
            format='json',
        )
        processo = Processo_Doacao.objects.get(pk=resposta_inicio.data['id'])
        processo.status = StatusProcesso.TRIAGEM
        processo.save(update_fields=['status'])
        self.client.force_authenticate(self.medico)
        resposta_decisao = self.decidir(processo, aprovado=True)

        self.assertEqual(resposta_inicio.status_code, status.HTTP_201_CREATED)
        self.assertEqual(processo.questionario_id, questionario.id)
        self.assertEqual(
            resposta_decisao.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
