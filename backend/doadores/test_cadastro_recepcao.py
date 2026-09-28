from rest_framework import status
from rest_framework.test import APITestCase

from doadores.models import Doador
from enfermeiros.models import Enfermeiro
from medicos.models import Medico
from recepcionistas.models import Recepcionista


class CadastroRecepcaoTests(APITestCase):
    def setUp(self):
        comuns = {
            'password': 'SenhaForte123',
            'endereco': 'Rua de Teste, 1',
            'nome_completo': 'Profissional de Teste',
        }
        self.recepcionista = Recepcionista.objects.create_user(
            cpf='10000000001', email='recepcao@amadoar.test', **comuns,
        )
        self.medico = Medico.objects.create_user(
            cpf='10000000002', email='medico@amadoar.test', crm='CRM-AC-1010', **comuns,
        )
        self.enfermeiro = Enfermeiro.objects.create_user(
            cpf='10000000003', email='enfermeiro@amadoar.test', coren='COREN-AC-1010', **comuns,
        )
        self.doador = Doador.objects.create_user(
            cpf='12345678909', email='existente@amadoar.test',
            sexo='F', telefone='68999999999', **comuns,
        )
        self.payload = {
            'cpf': '52998224725',
            'email': 'novo@amadoar.test',
            'nome_completo': 'Novo Doador',
            'endereco': 'Rua Nova, 2',
            'telefone': '68999999999',
            'data_nascimento': '1990-01-01',
            'sexo': 'F',
            'tipo_sanguineo_declarado': 'O',
            'fator_rh': '+',
        }

    def autenticar(self, usuario, senha='SenhaForte123'):
        resposta = self.client.post('/api/token/', {
            'cpf': usuario.cpf, 'password': senha,
        }, format='json')
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resposta.data['access']}")
        return resposta.data

    def test_recepcao_cria_doador_com_senha_temporaria_e_troca_obrigatoria(self):
        self.autenticar(self.recepcionista)
        resposta = self.client.post('/api/doadores/cadastro-recepcao/', {
            **self.payload, 'password': 'SenhaIgnorada999',
            'deve_alterar_senha': False,
        }, format='json')
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        doador = Doador.objects.get(cpf=self.payload['cpf'])
        self.assertTrue(doador.deve_alterar_senha)
        self.assertTrue(doador.check_password('Senha123'))
        self.assertNotEqual(doador.password, 'Senha123')
        self.assertFalse(doador.check_password('SenhaIgnorada999'))

        self.client.credentials()
        login = self.client.post('/api/token/', {
            'cpf': doador.cpf, 'password': 'Senha123',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data['tipo'], 'doador')
        self.assertTrue(login.data['deve_alterar_senha'])

    def test_cadastro_publico_continua_sem_troca_obrigatoria(self):
        resposta = self.client.post('/api/doadores/', {
            **self.payload, 'password': 'SenhaForte456',
            'deve_alterar_senha': True,
        }, format='json')
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        doador = Doador.objects.get(cpf=self.payload['cpf'])
        self.assertFalse(doador.deve_alterar_senha)
        self.assertTrue(doador.check_password('SenhaForte456'))

    def test_permissao_exclusiva_da_recepcao(self):
        for usuario in [None, self.medico, self.enfermeiro, self.doador]:
            with self.subTest(usuario=usuario):
                self.client.credentials()
                if usuario:
                    self.autenticar(usuario)
                resposta = self.client.post(
                    '/api/doadores/cadastro-recepcao/', self.payload,
                    format='json',
                )
                self.assertIn(resposta.status_code, [401, 403])
        self.assertFalse(Doador.objects.filter(cpf=self.payload['cpf']).exists())

    def test_cpf_e_email_duplicados_sao_rejeitados(self):
        self.autenticar(self.recepcionista)
        for campo in ['cpf', 'email']:
            with self.subTest(campo=campo):
                resposta = self.client.post('/api/doadores/cadastro-recepcao/', {
                    **self.payload,
                    campo: getattr(self.doador, campo),
                }, format='json')
                self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(campo, resposta.data)

    def test_troca_bloqueia_outras_apis_e_revoga_tokens_antigos(self):
        self.autenticar(self.recepcionista)
        self.client.post('/api/doadores/cadastro-recepcao/', self.payload, format='json')
        doador = Doador.objects.get(cpf=self.payload['cpf'])
        self.client.credentials()
        login = self.autenticar(doador, 'Senha123')
        self.assertTrue(login['deve_alterar_senha'])

        bloqueio = self.client.get('/api/doadores/me/')
        self.assertEqual(bloqueio.status_code, status.HTTP_403_FORBIDDEN)
        consulta = self.client.get('/api/usuarios/me/')
        self.assertEqual(consulta.status_code, status.HTTP_200_OK)
        self.assertTrue(consulta.data['deve_alterar_senha'])

        senha_fraca = self.client.post('/api/usuarios/trocar-senha-obrigatoria/', {
            'senha_atual': 'Senha123', 'nova_senha': '123',
            'confirmar_nova_senha': '123',
        }, format='json')
        self.assertEqual(senha_fraca.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Doador.objects.get(pk=doador.pk).deve_alterar_senha)

        troca = self.client.post('/api/usuarios/trocar-senha-obrigatoria/', {
            'senha_atual': 'Senha123', 'nova_senha': 'NovaSenhaForte987',
            'confirmar_nova_senha': 'NovaSenhaForte987',
        }, format='json')
        self.assertEqual(troca.status_code, status.HTTP_200_OK)
        doador.refresh_from_db()
        self.assertFalse(doador.deve_alterar_senha)
        self.assertTrue(doador.check_password('NovaSenhaForte987'))
        self.assertFalse(doador.check_password('Senha123'))
        self.assertEqual(self.client.get('/api/usuarios/me/').status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post('/api/token/refresh/', {
            'refresh': login['refresh'],
        }, format='json').status_code, 401)
        self.assertEqual(self.client.post('/api/token/', {
            'cpf': doador.cpf, 'password': 'Senha123',
        }, format='json').status_code, 401)
        novo_login = self.client.post('/api/token/', {
            'cpf': doador.cpf, 'password': 'NovaSenhaForte987',
        }, format='json')
        self.assertEqual(novo_login.status_code, 200)
        self.assertFalse(novo_login.data['deve_alterar_senha'])
