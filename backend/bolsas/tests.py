import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError, transaction
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from administradores.models import Administrador
from choices import StatusBolsa
from core.models import Tipo_Sanguineo
from doadores.models import Doador
from enfermeiros.models import Enfermeiro
from medicos.models import Medico
from processos_doacao.models import Processo_Doacao
from recepcionistas.models import Recepcionista

from .models import Bolsa


class IntegridadeBolsaTests(APITestCase):
    @classmethod
    def setUpClass(cls):
        cls._media_directory = tempfile.TemporaryDirectory()
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_directory.name)
        cls._media_override.enable()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        cls._media_override.disable()
        cls._media_directory.cleanup()

    @classmethod
    def setUpTestData(cls):
        campos_comuns = {
            'endereco': 'Rua de Teste, 1',
            'data_nascimento': '1990-01-01',
            'email': 'teste@example.com',
        }
        cls.administrador = Administrador.objects.create(
            cpf='00000000001', nome_completo='Administrador Teste', **campos_comuns
        )
        cls.medico = Medico.objects.create(
            cpf='00000000002', nome_completo='Medico Teste', crm='CRM-TESTE',
            **campos_comuns,
        )
        cls.enfermeiro = Enfermeiro.objects.create(
            cpf='00000000003', nome_completo='Enfermeiro Teste',
            coren='COREN-TESTE', **campos_comuns,
        )
        cls.recepcionista = Recepcionista.objects.create(
            cpf='00000000004', nome_completo='Recepcionista Teste', **campos_comuns
        )
        cls.doador = Doador.objects.create(
            cpf='00000000005', nome_completo='Doador Teste', sexo='M',
            telefone='68999999999', **campos_comuns,
        )
        cls.tipo_a_positivo = Tipo_Sanguineo.objects.get(tipo='A', fator_rh='+')

    def setUp(self):
        self.processo = Processo_Doacao.objects.create(
            doador=self.doador,
            recepcionista=self.recepcionista,
        )

    def autenticar(self, usuario):
        self.client.force_authenticate(user=usuario)

    def criar_bolsa_aguardando(self):
        return Bolsa.objects.create(
            processo=self.processo,
            doador=self.doador,
            enfermeiro_coleta=self.enfermeiro,
        )

    def dados_criacao(self):
        return {
            'processo': self.processo.pk,
            'doador': self.doador.pk,
            'enfermeiro_coleta': self.enfermeiro.pk,
        }

    @staticmethod
    def laudo():
        return SimpleUploadedFile(
            'laudo.pdf',
            b'%PDF-1.4 conteudo de teste',
            content_type='application/pdf',
        )

    def test_criar_bolsa_aguardando_sem_tipo_e_permitido(self):
        self.autenticar(self.administrador)
        response = self.client.post('/api/estoque/', self.dados_criacao())

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        bolsa = Bolsa.objects.get(pk=response.data['id'])
        self.assertEqual(bolsa.status, StatusBolsa.AGUARDANDO)
        self.assertIsNone(bolsa.tipo_sanguineo)

    def test_criar_diretamente_como_validado_sem_tipo_e_bloqueado(self):
        self.autenticar(self.administrador)
        dados = self.dados_criacao() | {
            'status': StatusBolsa.VALIDADO,
            'tipo_sanguineo': None,
        }
        quantidade_antes = Bolsa.objects.count()

        response = self.client.post('/api/estoque/', dados, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Bolsa.objects.count(), quantidade_antes)

    def test_patch_padrao_nao_pode_validar_bolsa(self):
        self.autenticar(self.administrador)
        bolsa = self.criar_bolsa_aguardando()

        response = self.client.patch(
            f'/api/estoque/{bolsa.pk}/',
            {'status': StatusBolsa.VALIDADO, 'tipo_sanguineo': None},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.AGUARDANDO)
        self.assertIsNone(bolsa.tipo_sanguineo)

    def test_put_padrao_nao_pode_validar_bolsa(self):
        self.autenticar(self.administrador)
        bolsa = self.criar_bolsa_aguardando()
        dados = self.dados_criacao() | {
            'status': StatusBolsa.VALIDADO,
            'tipo_sanguineo': self.tipo_a_positivo.pk,
        }

        response = self.client.put(f'/api/estoque/{bolsa.pk}/', dados, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.AGUARDANDO)
        self.assertIsNone(bolsa.tipo_sanguineo)

    def test_validar_sem_tipo_retorna_400_e_nao_altera_bolsa(self):
        self.autenticar(self.medico)
        bolsa = self.criar_bolsa_aguardando()

        response = self.client.patch(
            f'/api/estoque/{bolsa.pk}/validar/',
            {'arquivo_laudo': self.laudo(), 'medico_validacao': self.medico.pk},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.AGUARDANDO)
        self.assertIsNone(bolsa.tipo_sanguineo)
        self.assertFalse(bolsa.arquivo_laudo)
        self.assertIsNone(bolsa.medico_validacao)

    def test_validar_com_dados_completos_e_permitido(self):
        self.autenticar(self.medico)
        bolsa = self.criar_bolsa_aguardando()

        response = self.client.patch(
            f'/api/estoque/{bolsa.pk}/validar/',
            {
                'tipo_sanguineo': self.tipo_a_positivo.pk,
                'arquivo_laudo': self.laudo(),
                'medico_validacao': self.medico.pk,
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.VALIDADO)
        self.assertEqual(bolsa.tipo_sanguineo, self.tipo_a_positivo)
        self.assertEqual(bolsa.medico_validacao, self.medico)
        self.assertTrue(bolsa.arquivo_laudo)
        self.assertIsNotNone(bolsa.data_vencimento)

    def test_model_nao_permite_bolsa_validada_sem_tipo(self):
        bolsa = Bolsa(
            processo=self.processo,
            doador=self.doador,
            status=StatusBolsa.VALIDADO,
        )

        with self.assertRaises(ValidationError):
            bolsa.save()

        self.assertIsNone(bolsa.pk)

    def test_constraint_nao_permite_bypass_de_bolsa_validada_sem_tipo(self):
        bolsa = self.criar_bolsa_aguardando()

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Bolsa.objects.filter(pk=bolsa.pk).update(
                    status=StatusBolsa.VALIDADO,
                )

        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.AGUARDANDO)
        self.assertIsNone(bolsa.tipo_sanguineo)

    def test_model_nao_permite_bolsa_validada_com_tipo_sem_rh(self):
        tipo_sem_rh = self.tipo_a_positivo
        tipo_sem_rh.fator_rh = ''
        bolsa = Bolsa(
            processo=self.processo,
            doador=self.doador,
            tipo_sanguineo=tipo_sem_rh,
            status=StatusBolsa.VALIDADO,
        )

        with self.assertRaises(ValidationError):
            bolsa.save()

        self.assertIsNone(bolsa.pk)

    def test_registrar_uso_em_bolsa_sem_tipo_e_bloqueado(self):
        self.autenticar(self.medico)
        bolsa = Bolsa(
            id=99999,
            processo=self.processo,
            doador=self.doador,
            status=StatusBolsa.VALIDADO,
            medico_validacao=self.medico,
            arquivo_laudo='laudos_bolsas/laudo.pdf',
            data_vencimento=timezone.now().date() + timedelta(days=1),
        )

        with patch('bolsas.views.BolsaViewSet.get_object', return_value=bolsa):
            response = self.client.patch('/api/estoque/99999/registrar_uso/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo sangu', response.data['erro'].lower())

    def test_registrar_uso_em_bolsa_vencida_e_bloqueado(self):
        self.autenticar(self.medico)
        bolsa = Bolsa.objects.create(
            processo=self.processo,
            doador=self.doador,
            tipo_sanguineo=self.tipo_a_positivo,
            medico_validacao=self.medico,
            arquivo_laudo='laudos_bolsas/laudo.pdf',
            status=StatusBolsa.VALIDADO,
            data_vencimento=timezone.now().date() - timedelta(days=1),
        )

        response = self.client.patch(f'/api/estoque/{bolsa.pk}/registrar_uso/')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        bolsa.refresh_from_db()
        self.assertEqual(bolsa.status, StatusBolsa.VALIDADO)

    def test_catalogo_nao_permite_duplicar_a_positivo(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Tipo_Sanguineo.objects.create(tipo='A', fator_rh='+')

    def test_catalogo_nao_permite_abo_invalido(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Tipo_Sanguineo.objects.create(tipo='X', fator_rh='+')

    def test_catalogo_nao_permite_rh_invalido(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Tipo_Sanguineo.objects.create(tipo='A', fator_rh='X')
