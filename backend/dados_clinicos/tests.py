from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from choices import StatusClinico, StatusProcesso
from doadores.models import Doador
from medicos.models import Medico
from processos_doacao.models import Processo_Doacao
from recepcionistas.models import Recepcionista
from triagem.models import Questionario

from .models import Dados_Clinicos


class ValidacaoPreTriagemTests(APITestCase):
    def setUp(self):
        self.medico = Medico.objects.create_user(
            cpf='94444444444', password='teste', email='pre-medico@teste.local',
            endereco='Teste', nome_completo='Médico de Teste', crm='PRE-1',
        )
        self.recepcionista = Recepcionista.objects.create_user(
            cpf='95555555555', password='teste', email='pre-recepcao@teste.local',
            endereco='Teste', nome_completo='Recepcionista de Teste',
        )
        self.client.force_authenticate(self.medico)
        self.url = reverse('dados-clinicos-list')

    def criar_processo(self, sexo='M', status_processo=StatusProcesso.PRE_TRIAGEM):
        indice = Doador.objects.count() + 1
        doador = Doador.objects.create_user(
            cpf=f'{96000000000 + indice}', password='teste',
            email=f'pre-doador-{indice}@teste.local', endereco='Teste',
            nome_completo='Doador de Teste', sexo=sexo,
            telefone='68999999999',
        )
        return Processo_Doacao.objects.create(
            doador=doador, recepcionista=self.recepcionista,
            status=status_processo,
        )

    def enviar(self, processo, **alteracoes):
        payload = {
            'processo_id': processo.pk,
            'altura': 1.75,
            'peso': 70,
            'hemoglobina': 13.5,
            'status_clinico': StatusClinico.APTO,
        }
        payload.update(alteracoes)
        return self.client.post(self.url, payload, format='json')

    def test_aceita_medicoes_validas_e_preserva_decimais(self):
        processo = self.criar_processo()
        resposta = self.enviar(processo, altura=1.75, peso=70.5, hemoglobina=13.5)

        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        dados = Dados_Clinicos.objects.get(processo=processo)
        self.assertEqual((dados.altura, dados.peso, dados.hemoglobina), (1.75, 70.5, 13.5))
        self.assertEqual(resposta.data['hemoglobina'], 13.5)

    def test_rejeita_bypass_com_medicoes_estruturalmente_invalidas(self):
        for campo, valor in [
            ('altura', 0), ('altura', -1), ('altura', 3.01),
            ('peso', 0), ('peso', 1000),
            ('hemoglobina', 0), ('hemoglobina', -1),
            ('hemoglobina', 50), ('hemoglobina', 130), ('hemoglobina', 999),
        ]:
            with self.subTest(campo=campo, valor=valor):
                processo = self.criar_processo()
                resposta = self.enviar(processo, **{campo: valor})
                self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(campo, resposta.data)
                self.assertFalse(Dados_Clinicos.objects.filter(processo=processo).exists())

    def test_fronteiras_da_hemoglobina_por_sexo(self):
        for sexo, hemoglobina, aceito in [
            ('F', 12.4, False), ('F', 12.5, True), ('F', 17.9, True),
            ('F', 18.0, False), ('M', 12.9, False), ('M', 13.0, True),
            ('M', 17.9, True), ('M', 18.0, False),
        ]:
            with self.subTest(sexo=sexo, hemoglobina=hemoglobina):
                processo = self.criar_processo(sexo)
                resposta = self.enviar(
                    processo, hemoglobina=hemoglobina,
                    sexo='F' if sexo == 'M' else 'M',
                )
                self.assertEqual(
                    resposta.status_code,
                    status.HTTP_201_CREATED if aceito else status.HTTP_400_BAD_REQUEST,
                )

    def test_peso_abaixo_do_minimo_bloqueia_apto_mas_permite_inapto(self):
        processo_apto = self.criar_processo()
        resposta_apto = self.enviar(processo_apto, peso=49)
        processo_inapto = self.criar_processo()
        resposta_inapto = self.enviar(
            processo_inapto, peso=48, status_clinico=StatusClinico.INAPTO,
        )

        self.assertEqual(resposta_apto.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resposta_inapto.status_code, status.HTTP_201_CREATED)

    def test_hemoglobina_baixa_permanece_valida_para_inapto(self):
        processo = self.criar_processo('F')
        resposta = self.enviar(
            processo, hemoglobina=12.0, status_clinico=StatusClinico.INAPTO,
        )
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_sem_hemoglobina_nao_conclui_pre_triagem(self):
        processo = self.criar_processo()
        resposta = self.enviar(processo, hemoglobina=None)
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Dados_Clinicos.objects.filter(processo=processo).exists())

    def test_triagem_medica_sem_pre_triagem_cria_hemoglobina_nula(self):
        processo = self.criar_processo(status_processo=StatusProcesso.TRIAGEM)
        processo.questionario = Questionario.objects.create(
            doador=processo.doador, validade=True,
        )
        processo.save(update_fields=['questionario'])
        resposta = self.client.post(
            reverse('processo-decidir-triagem', kwargs={'pk': processo.pk}),
            {'pressao_arterial': '120x80', 'aprovado': True, 'medico_id': self.medico.pk},
            format='json',
        )

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertIsNone(Dados_Clinicos.objects.get(processo=processo).hemoglobina)

    def test_registros_historicos_nao_sao_convertidos(self):
        processos = [self.criar_processo() for _ in range(3)]
        for processo, valor in zip(processos, (14.2, 123.0, 1233.0)):
            Dados_Clinicos.objects.create(
                processo=processo, peso=70, altura=1.75,
                hemoglobina=valor, status_clinico=StatusClinico.INAPTO,
            )

        self.enviar(self.criar_processo())

        self.assertEqual(
            list(Dados_Clinicos.objects.filter(processo__in=processos).order_by('id').values_list('hemoglobina', flat=True)),
            [14.2, 123.0, 1233.0],
        )

    def test_consulta_e_edicao_de_ficha_existente_mantem_escala_g_dl(self):
        processo = self.criar_processo()
        resposta_criacao = self.enviar(processo)
        dados_id = resposta_criacao.data['id']

        resposta_consulta = self.client.get(
            reverse('processo-detail', kwargs={'pk': processo.pk})
        )
        resposta_edicao = self.client.patch(
            reverse('dados-clinicos-detail', kwargs={'pk': dados_id}),
            {'hemoglobina': 13.7}, format='json',
        )

        self.assertEqual(resposta_consulta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta_consulta.data['dados_clinicos']['hemoglobina'], 13.5)
        self.assertEqual(resposta_edicao.status_code, status.HTTP_200_OK)
        self.assertEqual(Dados_Clinicos.objects.get(pk=dados_id).hemoglobina, 13.7)
