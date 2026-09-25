from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from administradores.models import Administrador
from doadores.models import Doador
from enfermeiros.models import Enfermeiro
from medicos.models import Medico
from recepcionistas.models import Recepcionista
from usuarios.models import Usuario


class CriacaoProfissionaisPermissionTests(APITestCase):
    endpoints = {
        'medico': ('/api/medicos/', Medico),
        'enfermeiro': ('/api/enfermeiros/', Enfermeiro),
        'recepcionista': ('/api/recepcionistas/', Recepcionista),
    }

    @classmethod
    def setUpTestData(cls):
        dados_comuns = {
            'password': 'SenhaForte123',
            'email': 'perfil@amadoar.test',
            'endereco': 'Endereco de teste',
            'nome_completo': 'Perfil de Teste',
        }

        cls.administrador = Administrador.objects.create_user(
            cpf='10000000001',
            **dados_comuns,
        )
        cls.medico = Medico.objects.create_user(
            cpf='10000000002',
            crm='CRM-AC-1001',
            **dados_comuns,
        )
        cls.enfermeiro = Enfermeiro.objects.create_user(
            cpf='10000000003',
            coren='COREN-AC-1001',
            **dados_comuns,
        )
        cls.recepcionista = Recepcionista.objects.create_user(
            cpf='10000000004',
            **dados_comuns,
        )
        cls.doador = Doador.objects.create_user(
            cpf='10000000005',
            sexo='F',
            telefone='(68) 99999-9999',
            **dados_comuns,
        )

    def setUp(self):
        self.client = APIClient()

    def autenticar(self, usuario):
        token = AccessToken.for_user(usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def payload(self, perfil, indice):
        dados = {
            'cpf': f'20000000{indice:03d}',
            'nome_completo': f'Novo {perfil}',
            'email': f'novo-{perfil}-{indice}@amadoar.test',
            'endereco': 'Endereco do novo profissional',
            'data_nascimento': '1990-01-01',
            'password': 'SenhaForte123',
        }

        if perfil == 'medico':
            dados['crm'] = f'CRM-AC-{indice:04d}'
        elif perfil == 'enfermeiro':
            dados['coren'] = f'COREN-AC-{indice:04d}'

        return dados

    def assert_criacao_bloqueada(self, usuario, status_esperado):
        self.client.credentials()
        if usuario is not None:
            self.autenticar(usuario)

        for indice, (perfil, (endpoint, model)) in enumerate(
            self.endpoints.items(),
            start=1,
        ):
            with self.subTest(perfil=perfil):
                total_usuarios_antes = Usuario.objects.count()
                total_perfil_antes = model.objects.count()

                resposta = self.client.post(
                    endpoint,
                    self.payload(perfil, indice),
                    format='json',
                )

                self.assertEqual(resposta.status_code, status_esperado)
                self.assertEqual(Usuario.objects.count(), total_usuarios_antes)
                self.assertEqual(model.objects.count(), total_perfil_antes)

    def test_administrador_pode_criar_profissionais(self):
        self.autenticar(self.administrador)

        for indice, (perfil, (endpoint, model)) in enumerate(
            self.endpoints.items(),
            start=10,
        ):
            with self.subTest(perfil=perfil):
                total_antes = model.objects.count()

                resposta = self.client.post(
                    endpoint,
                    self.payload(perfil, indice),
                    format='json',
                )

                self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
                self.assertEqual(model.objects.count(), total_antes + 1)

    def test_medico_nao_pode_criar_profissionais(self):
        self.assert_criacao_bloqueada(self.medico, status.HTTP_403_FORBIDDEN)

    def test_enfermeiro_nao_pode_criar_profissionais(self):
        self.assert_criacao_bloqueada(self.enfermeiro, status.HTTP_403_FORBIDDEN)

    def test_recepcionista_nao_pode_criar_profissionais(self):
        self.assert_criacao_bloqueada(
            self.recepcionista,
            status.HTTP_403_FORBIDDEN,
        )

    def test_doador_nao_pode_criar_profissionais(self):
        self.assert_criacao_bloqueada(self.doador, status.HTTP_403_FORBIDDEN)

    def test_usuario_nao_autenticado_nao_pode_criar_profissionais(self):
        self.assert_criacao_bloqueada(None, status.HTTP_401_UNAUTHORIZED)


class GestaoProfissionaisPermissionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.administrador = Administrador.objects.create_user(
            cpf='30000000001',
            password='SenhaForte123',
            email='administrador@amadoar.test',
            endereco='Endereco do administrador',
            nome_completo='Administrador de Teste',
        )

        cls.medico = Medico.objects.create_user(
            cpf='30000000002',
            password='SenhaForte123',
            email='medico@amadoar.test',
            endereco='Endereco do medico',
            nome_completo='Medico de Teste',
            crm='CRM-AC-2001',
        )
        cls.outro_medico = Medico.objects.create_user(
            cpf='30000000003',
            password='SenhaForte123',
            email='outro-medico@amadoar.test',
            endereco='Endereco do outro medico',
            nome_completo='Outro Medico',
            crm='CRM-AC-2002',
        )

        cls.enfermeiro = Enfermeiro.objects.create_user(
            cpf='30000000004',
            password='SenhaForte123',
            email='enfermeiro@amadoar.test',
            endereco='Endereco do enfermeiro',
            nome_completo='Enfermeiro de Teste',
            coren='COREN-AC-2001',
        )
        cls.outro_enfermeiro = Enfermeiro.objects.create_user(
            cpf='30000000005',
            password='SenhaForte123',
            email='outro-enfermeiro@amadoar.test',
            endereco='Endereco do outro enfermeiro',
            nome_completo='Outro Enfermeiro',
            coren='COREN-AC-2002',
        )

        cls.recepcionista = Recepcionista.objects.create_user(
            cpf='30000000006',
            password='SenhaForte123',
            email='recepcionista@amadoar.test',
            endereco='Endereco do recepcionista',
            nome_completo='Recepcionista de Teste',
        )
        cls.outro_recepcionista = Recepcionista.objects.create_user(
            cpf='30000000007',
            password='SenhaForte123',
            email='outro-recepcionista@amadoar.test',
            endereco='Endereco do outro recepcionista',
            nome_completo='Outro Recepcionista',
        )

    def setUp(self):
        self.client = APIClient()
        self.perfis = {
            'medico': (
                self.medico,
                self.outro_medico,
                '/api/medicos/',
                Medico,
            ),
            'enfermeiro': (
                self.enfermeiro,
                self.outro_enfermeiro,
                '/api/enfermeiros/',
                Enfermeiro,
            ),
            'recepcionista': (
                self.recepcionista,
                self.outro_recepcionista,
                '/api/recepcionistas/',
                Recepcionista,
            ),
        }

    def autenticar(self, usuario):
        self.client.credentials()
        token = AccessToken.for_user(usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_administrador_pode_editar_e_excluir_profissionais(self):
        self.autenticar(self.administrador)

        for perfil, (_, alvo, endpoint, model) in self.perfis.items():
            with self.subTest(perfil=perfil):
                novo_nome = f'{perfil} atualizado pelo administrador'
                resposta_patch = self.client.patch(
                    f'{endpoint}{alvo.pk}/',
                    {'nome_completo': novo_nome},
                    format='json',
                )

                self.assertEqual(
                    resposta_patch.status_code,
                    status.HTTP_200_OK,
                )
                alvo.refresh_from_db()
                self.assertEqual(alvo.nome_completo, novo_nome)

                usuario_id = alvo.pk
                resposta_delete = self.client.delete(f'{endpoint}{alvo.pk}/')

                self.assertEqual(
                    resposta_delete.status_code,
                    status.HTTP_204_NO_CONTENT,
                )
                self.assertFalse(model.objects.filter(pk=usuario_id).exists())
                self.assertFalse(Usuario.objects.filter(pk=usuario_id).exists())

    def test_profissional_nao_pode_editar_outro_do_mesmo_perfil(self):
        for perfil, (usuario, alvo, endpoint, _) in self.perfis.items():
            self.autenticar(usuario)
            nome_original = alvo.nome_completo
            endereco_original = alvo.endereco

            for metodo in ['patch', 'put']:
                with self.subTest(perfil=perfil, metodo=metodo):
                    resposta = getattr(self.client, metodo)(
                        f'{endpoint}{alvo.pk}/',
                        {
                            'nome_completo': 'Alteracao indevida',
                            'endereco': 'Endereco alterado indevidamente',
                            'cargo': 'administrador',
                            'perfil': 'administrador',
                            'tipo_usuario': 'administrador',
                        },
                        format='json',
                    )

                    self.assertEqual(
                        resposta.status_code,
                        status.HTTP_403_FORBIDDEN,
                    )
                    alvo.refresh_from_db()
                    self.assertEqual(alvo.nome_completo, nome_original)
                    self.assertEqual(alvo.endereco, endereco_original)

    def test_profissional_nao_pode_excluir_outro_do_mesmo_perfil(self):
        for perfil, (usuario, alvo, endpoint, model) in self.perfis.items():
            with self.subTest(perfil=perfil):
                self.autenticar(usuario)
                usuario_id = alvo.pk
                total_usuarios_antes = Usuario.objects.count()
                total_perfil_antes = model.objects.count()

                resposta = self.client.delete(f'{endpoint}{alvo.pk}/')

                self.assertEqual(
                    resposta.status_code,
                    status.HTTP_403_FORBIDDEN,
                )
                self.assertEqual(Usuario.objects.count(), total_usuarios_antes)
                self.assertEqual(model.objects.count(), total_perfil_antes)
                self.assertTrue(model.objects.filter(pk=usuario_id).exists())
                self.assertTrue(Usuario.objects.filter(pk=usuario_id).exists())

    def test_profissional_pode_editar_proprio_perfil_por_me(self):
        for perfil, (usuario, _, endpoint, model) in self.perfis.items():
            with self.subTest(perfil=perfil):
                self.autenticar(usuario)
                novo_endereco = f'Novo endereco do {perfil}'

                resposta = self.client.patch(
                    f'{endpoint}me/',
                    {'endereco': novo_endereco},
                    format='json',
                )

                self.assertEqual(resposta.status_code, status.HTTP_200_OK)
                usuario_atualizado = model.objects.get(pk=usuario.pk)
                self.assertEqual(usuario_atualizado.endereco, novo_endereco)

    def test_medico_nao_pode_editar_enfermeiro_por_id(self):
        self.autenticar(self.medico)
        nome_original = self.outro_enfermeiro.nome_completo

        resposta = self.client.patch(
            f'/api/enfermeiros/{self.outro_enfermeiro.pk}/',
            {
                'nome_completo': 'Alteracao cruzada indevida',
                'cargo': 'administrador',
            },
            format='json',
        )

        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        self.outro_enfermeiro.refresh_from_db()
        self.assertEqual(self.outro_enfermeiro.nome_completo, nome_original)
