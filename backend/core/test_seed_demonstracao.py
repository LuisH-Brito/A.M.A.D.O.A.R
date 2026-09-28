from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.db.models import Count
from django.test import TestCase
from django.utils import timezone

from bolsas.models import Bolsa
from choices import StatusBolsa, StatusClinico, StatusProcesso
from core.models import Tipo_Sanguineo
from dados_clinicos.models import Dados_Clinicos
from doadores.models import Doador
from exames_doador.models import Exame_Doador
from processos_doacao.models import Processo_Doacao
from triagem.models import Pergunta, Questionario


class SeedDemonstracaoTest(TestCase):
    CPFS_PRINCIPAIS = {
        'A+': '11732693200',
        'A-': '10100000126',
        'B+': '10100000207',
        'B-': '10100000398',
        'AB+': '10100000479',
        'AB-': '10100000550',
        'O+': '10100000630',
        'O-': '78974427214',
    }
    CPFS_CARTEIRA = {'11732693200', '10100000207', '10100000630'}

    def test_tipos_e_doadores_principais(self):
        self.assertEqual(Tipo_Sanguineo.objects.count(), 8)
        for tipo, cpf in self.CPFS_PRINCIPAIS.items():
            doador = Doador.objects.get(cpf=cpf)
            self.assertEqual(
                f'{doador.tipo_sanguineo_declarado}{doador.fator_rh}',
                tipo,
            )
            self.assertTrue(doador.check_password('senha123'))
            self.assertTrue(doador.exames_doador.exists())

    def test_hemometro_cobre_todas_as_faixas(self):
        hoje = timezone.localdate()
        contagens = {
            f'{item["tipo_sanguineo__tipo"]}{item["tipo_sanguineo__fator_rh"]}': item['total']
            for item in Bolsa.objects.filter(
                status=StatusBolsa.VALIDADO,
                data_vencimento__gte=hoje,
            ).values(
                'tipo_sanguineo__tipo', 'tipo_sanguineo__fator_rh',
            ).annotate(total=Count('id'))
        }
        self.assertEqual(
            contagens,
            {'A+': 9, 'B+': 6, 'O+': 2, 'O-': 1},
        )
        percentuais = {
            tipo: min(100, round(contagens.get(tipo, 0) / 10 * 100))
            for tipo in self.CPFS_PRINCIPAIS
        }
        self.assertLessEqual(percentuais['O-'], 16.6)
        self.assertTrue(16.6 < percentuais['O+'] <= 50)
        self.assertTrue(50 < percentuais['B+'] <= 83.3)
        self.assertGreater(percentuais['A+'], 83.3)

    def test_carteira_tem_exatamente_os_tres_doadores_planejados(self):
        elegiveis = set(
            Bolsa.objects.values(
                'doador',
                'tipo_sanguineo__tipo',
                'tipo_sanguineo__fator_rh',
            ).annotate(total=Count('id')).filter(
                total__gte=3,
                doador__carteira_doador='',
            ).values_list('doador__cpf', flat=True)
        )
        self.assertEqual(elegiveis, self.CPFS_CARTEIRA)
        for cpf in self.CPFS_CARTEIRA:
            self.assertGreater(
                Bolsa.objects.filter(doador__cpf=cpf).count(),
                3,
            )

    def test_fluxos_de_bolsa_sao_completos_e_um_por_processo(self):
        quantidade_perguntas = Pergunta.objects.filter(ativa=True).count()
        duplicados = (
            Bolsa.objects.values('processo_id')
            .annotate(total=Count('id'))
            .filter(total__gt=1)
        )
        self.assertFalse(duplicados.exists())
        for bolsa in Bolsa.objects.select_related(
            'processo__questionario', 'processo__dados_clinicos', 'doador',
        ):
            self.assertEqual(bolsa.doador_id, bolsa.processo.doador_id)
            self.assertEqual(bolsa.processo.status, StatusProcesso.CONCLUIDO)
            self.assertTrue(bolsa.processo.questionario.validade)
            self.assertEqual(
                bolsa.processo.questionario.respostas.count(),
                quantidade_perguntas,
            )
            self.assertEqual(
                bolsa.processo.dados_clinicos.status_clinico,
                StatusClinico.APTO,
            )

    def test_cenario_de_questionario_impeditivo(self):
        questionario = Questionario.objects.get(
            doador__cpf='10100000126',
            validade=False,
        )
        self.assertEqual(questionario.processo.status, StatusProcesso.TRIAGEM)
        respostas = questionario.respostas.select_related('pergunta')
        self.assertTrue(any(
            resposta.resposta_texto != resposta.pergunta.resposta_esperada
            for resposta in respostas
        ))

    def test_status_clinicos_estao_no_enum(self):
        invalidos = Dados_Clinicos.objects.exclude(
            status_clinico__in=[StatusClinico.INAPTO, StatusClinico.APTO],
        )
        self.assertFalse(invalidos.exists())

    def test_bolsas_representam_todos_os_estados_temporais(self):
        hoje = timezone.localdate()
        self.assertEqual(
            Bolsa.objects.filter(status=StatusBolsa.AGUARDANDO).count(), 3,
        )
        self.assertEqual(
            Bolsa.objects.filter(status=StatusBolsa.INAPTO).count(), 3,
        )
        self.assertEqual(
            Bolsa.objects.filter(status=StatusBolsa.UTILIZADO).count(), 3,
        )
        self.assertEqual(
            Bolsa.objects.filter(
                status=StatusBolsa.VALIDADO,
                data_vencimento__lt=hoje,
            ).count(),
            3,
        )
        self.assertEqual(
            Bolsa.objects.filter(
                status=StatusBolsa.VALIDADO,
                data_vencimento__gte=hoje,
                data_vencimento__lte=hoje + timedelta(days=7),
            ).count(),
            1,
        )

    def test_arquivos_pdf_referenciados_existem(self):
        arquivos = [
            exame.arquivo.name
            for exame in Exame_Doador.objects.filter(
                doador__cpf__in=self.CPFS_PRINCIPAIS.values(),
            )
        ]
        arquivos.extend(
            bolsa.arquivo_laudo.name
            for bolsa in Bolsa.objects.exclude(arquivo_laudo='')
        )
        self.assertEqual(len(arquivos), 38)
        for caminho_relativo in arquivos:
            caminho = Path(settings.MEDIA_ROOT) / caminho_relativo
            self.assertTrue(caminho.is_file(), caminho)
            self.assertEqual(caminho.read_bytes()[:8], b'%PDF-1.4')
