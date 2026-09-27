from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Doador


class AtualizacaoPerfilDoadorTests(APITestCase):
    def setUp(self):
        self.doador = Doador.objects.create_user(
            cpf='12345678909',
            password='SenhaForte123',
            email='doador@amadoar.test',
            endereco='Endereco de teste',
            nome_completo='Doador de Teste',
            sexo='F',
            telefone='(68) 99999-9999',
            data_nascimento='1990-01-01',
        )
        self.client.force_authenticate(user=self.doador)

    def test_doador_atualiza_e_recarrega_data_de_nascimento(self):
        nova_data = '1991-02-03'

        resposta_patch = self.client.patch(
            '/api/doadores/me/',
            {'data_nascimento': nova_data},
            format='json',
        )

        self.assertEqual(resposta_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta_patch.data['data_nascimento'], nova_data)

        resposta_get = self.client.get('/api/doadores/me/')

        self.assertEqual(resposta_get.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta_get.data['data_nascimento'], nova_data)

    def test_doador_nao_atualiza_data_de_nascimento_futura(self):
        data_futura = timezone.localdate() + timedelta(days=1)

        resposta = self.client.patch(
            '/api/doadores/me/',
            {'data_nascimento': data_futura.isoformat()},
            format='json',
        )

        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_nascimento', resposta.data)

        self.doador.refresh_from_db()
        self.assertEqual(self.doador.data_nascimento.isoformat(), '1990-01-01')
