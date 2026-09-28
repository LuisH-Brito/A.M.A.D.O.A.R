from datetime import datetime, time, timedelta
from pathlib import Path
import shutil

from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.db import migrations
from django.utils import timezone


SENHA_DEMONSTRACAO = 'senha123'

STATUS_PROCESSO_TRIAGEM = 3
STATUS_PROCESSO_CONCLUIDO = 5
STATUS_CLINICO_INAPTO = 0
STATUS_CLINICO_APTO = 1
STATUS_BOLSA_AGUARDANDO = 1
STATUS_BOLSA_VALIDADO = 2
STATUS_BOLSA_INAPTO = 3
STATUS_BOLSA_UTILIZADO = 4

CPF_RECEPCIONISTA = '04692461209'
CPF_ENFERMEIRO_PRE = '32952616280'
CPF_ENFERMEIRO_COLETA = '08242133271'
CPF_MEDICO = '97042023269'


DOADORES_PRINCIPAIS = [
    {
        'cpf': '11732693200', 'nome': 'Giovanni Ruan Renato Alves',
        'email': 'giovanni.demo@amadoar.test', 'sexo': 'M',
        'tipo': 'A', 'rh': '+', 'nascimento': '1990-04-16',
    },
    {
        'cpf': '10100000126', 'nome': 'Ana Clara Almeida',
        'email': 'ana.almeida.demo@amadoar.test', 'sexo': 'F',
        'tipo': 'A', 'rh': '-', 'nascimento': '1992-01-12',
    },
    {
        'cpf': '10100000207', 'nome': 'Bruno Barros Lima',
        'email': 'bruno.lima.demo@amadoar.test', 'sexo': 'M',
        'tipo': 'B', 'rh': '+', 'nascimento': '1988-03-21',
    },
    {
        'cpf': '10100000398', 'nome': 'Beatriz Nunes Silva',
        'email': 'beatriz.silva.demo@amadoar.test', 'sexo': 'F',
        'tipo': 'B', 'rh': '-', 'nascimento': '1994-07-09',
    },
    {
        'cpf': '10100000479', 'nome': 'Alex Martins Costa',
        'email': 'alex.costa.demo@amadoar.test', 'sexo': 'M',
        'tipo': 'AB', 'rh': '+', 'nascimento': '1987-11-30',
    },
    {
        'cpf': '10100000550', 'nome': 'Amanda Ribeiro Souza',
        'email': 'amanda.souza.demo@amadoar.test', 'sexo': 'F',
        'tipo': 'AB', 'rh': '-', 'nascimento': '1991-09-15',
    },
    {
        'cpf': '10100000630', 'nome': 'Otavio Pereira Melo',
        'email': 'otavio.melo.demo@amadoar.test', 'sexo': 'M',
        'tipo': 'O', 'rh': '+', 'nascimento': '1989-06-18',
    },
    {
        'cpf': '78974427214', 'nome': 'Louise Luzia Assuncao',
        'email': 'louise.demo@amadoar.test', 'sexo': 'F',
        'tipo': 'O', 'rh': '-', 'nascimento': '1993-06-04',
    },
]


DOADORES_APOIO = [
    *[
        {
            'cpf': cpf,
            'nome': f'Doador Apoio A Positivo {indice:02d}',
            'email': f'apoio.a.pos.{indice:02d}@amadoar.test',
            'sexo': 'M' if indice % 2 else 'F',
            'tipo': 'A', 'rh': '+', 'nascimento': '1990-01-15',
        }
        for indice, cpf in enumerate([
            '10100000983', '10100001017', '10100001106', '10100001289',
            '10100001360', '10100001440', '10100001521', '10100001602',
        ], start=1)
    ],
    *[
        {
            'cpf': cpf,
            'nome': f'Doador Apoio B Positivo {indice:02d}',
            'email': f'apoio.b.pos.{indice:02d}@amadoar.test',
            'sexo': 'M' if indice % 2 else 'F',
            'tipo': 'B', 'rh': '+', 'nascimento': '1991-02-20',
        }
        for indice, cpf in enumerate([
            '10100001793', '10100001874', '10100001955',
            '10100002099', '10100002170',
        ], start=1)
    ],
    {
        'cpf': '10100002250', 'nome': 'Doador Apoio O Positivo 01',
        'email': 'apoio.o.pos.01@amadoar.test', 'sexo': 'M',
        'tipo': 'O', 'rh': '+', 'nascimento': '1992-05-10',
    },
]


def _instante(data, hora=9):
    valor = datetime.combine(data, time(hour=hora))
    if timezone.is_aware(timezone.now()):
        return timezone.make_aware(valor, timezone.get_current_timezone())
    return valor


def _obter_ou_criar_questionario(Questionario, doador, data_hora, validade):
    try:
        questionario = Questionario.objects.get(
            doador=doador,
            data_hora_submissao=data_hora,
        )
        questionario.validade = validade
        questionario.save(update_fields=['validade'])
        return questionario
    except Questionario.DoesNotExist:
        questionario = Questionario.objects.create(
            doador=doador,
            validade=validade,
        )
        Questionario.objects.filter(pk=questionario.pk).update(
            data_hora_submissao=data_hora,
        )
        questionario.data_hora_submissao = data_hora
        return questionario


def _preencher_respostas(Resposta, perguntas, questionario, pergunta_impeditiva=None):
    for pergunta in perguntas:
        resposta = pergunta.resposta_esperada
        if pergunta_impeditiva and pergunta.texto == pergunta_impeditiva:
            resposta = 'Nao' if pergunta.resposta_esperada == 'Sim' else 'Sim'
        Resposta.objects.update_or_create(
            questionario=questionario,
            pergunta=pergunta,
            defaults={'resposta_texto': resposta},
        )


def _obter_ou_criar_processo(
    Processo, questionario, doador, recepcionista, status, data_inicio,
):
    processo, _ = Processo.objects.update_or_create(
        questionario=questionario,
        defaults={
            'doador': doador,
            'recepcionista': recepcionista,
            'status': status,
            'atendimento_usuario': None,
            'atendimento_atualizado_em': None,
        },
    )
    Processo.objects.filter(pk=processo.pk).update(data_inicio=data_inicio)
    processo.data_inicio = data_inicio
    return processo


def _criar_dados_clinicos(
    DadosClinicos, EnfermeiroDados, MedicoDados, processo, doador,
    enfermeiro_pre, enfermeiro_coleta, medico, status_clinico,
    fluxo_completo=True,
):
    hemoglobina = 14.2 if doador.sexo == 'M' else 13.4
    dados, _ = DadosClinicos.objects.update_or_create(
        processo=processo,
        defaults={
            'peso': 72.5,
            'altura': 1.70,
            'hemoglobina': hemoglobina,
            'pressao_arterial': '120/80',
            'status_clinico': status_clinico,
        },
    )
    EnfermeiroDados.objects.update_or_create(
        enfermeiro=enfermeiro_pre,
        dados=dados,
        papel='PRE_TRIAGEM',
    )
    if fluxo_completo:
        MedicoDados.objects.update_or_create(
            medico=medico,
            dados=dados,
            papel='TRIAGEM',
        )
        EnfermeiroDados.objects.update_or_create(
            enfermeiro=enfermeiro_coleta,
            dados=dados,
            papel='COLETA',
        )
    return dados


def inserir_demonstracao(apps, schema_editor):
    Administrador = apps.get_model('administradores', 'Administrador')
    Bolsa = apps.get_model('bolsas', 'Bolsa')
    DadosClinicos = apps.get_model('dados_clinicos', 'Dados_Clinicos')
    EnfermeiroDados = apps.get_model('dados_clinicos', 'EnfermeiroDados')
    MedicoDados = apps.get_model('dados_clinicos', 'MedicoDados')
    Doador = apps.get_model('doadores', 'Doador')
    Enfermeiro = apps.get_model('enfermeiros', 'Enfermeiro')
    ExameDoador = apps.get_model('exames_doador', 'Exame_Doador')
    Medico = apps.get_model('medicos', 'Medico')
    Processo = apps.get_model('processos_doacao', 'Processo_Doacao')
    Recepcionista = apps.get_model('recepcionistas', 'Recepcionista')
    Pergunta = apps.get_model('triagem', 'Pergunta')
    Questionario = apps.get_model('triagem', 'Questionario')
    Resposta = apps.get_model('triagem', 'Resposta')
    TipoSanguineo = apps.get_model('core', 'Tipo_Sanguineo')

    senha_hash = make_password(SENHA_DEMONSTRACAO)
    hoje = timezone.localdate()

    origem_arquivos = Path(__file__).resolve().parents[2] / 'demo_assets'
    for origem in origem_arquivos.rglob('*.pdf'):
        relativo = origem.relative_to(origem_arquivos)
        destino = Path(settings.MEDIA_ROOT) / relativo
        destino.parent.mkdir(parents=True, exist_ok=True)
        if not destino.exists() or destino.read_bytes() != origem.read_bytes():
            shutil.copyfile(origem, destino)

    # Corrige apenas o identificador invalido criado pela migration historica.
    try:
        administrador_legado = Administrador.objects.get(cpf='adm')
    except Administrador.DoesNotExist:
        administrador_legado = Administrador.objects.get(cpf='10100002331')
    administrador_legado.cpf = '10100002331'
    administrador_legado.email = 'admin.principal.demo@amadoar.test'
    administrador_legado.password = senha_hash
    administrador_legado.deve_alterar_senha = False
    administrador_legado.save()

    cpfs_profissionais = [
        '77590978248', '04692461209', '77513196230', '32952616280',
        '08242133271', '97042023269', '59713131266',
    ]
    for model in (Administrador, Recepcionista, Enfermeiro, Medico):
        model.objects.filter(cpf__in=cpfs_profissionais).update(
            password=senha_hash,
            deve_alterar_senha=False,
            is_active=True,
        )

    doadores = {}
    for item in DOADORES_PRINCIPAIS + DOADORES_APOIO:
        doador, _ = Doador.objects.update_or_create(
            cpf=item['cpf'],
            defaults={
                'nome_completo': item['nome'],
                'email': item['email'],
                'password': senha_hash,
                'endereco': 'Rua Demonstracao, 100, Rio Branco, Acre',
                'data_nascimento': item['nascimento'],
                'sexo': item['sexo'],
                'telefone': '68999990000',
                'tipo_sanguineo_declarado': item['tipo'],
                'fator_rh': item['rh'],
                'carteira_doador': '',
                'deve_alterar_senha': False,
                'is_active': True,
            },
        )
        doadores[item['cpf']] = doador

    recepcionista = Recepcionista.objects.get(cpf=CPF_RECEPCIONISTA)
    enfermeiro_pre = Enfermeiro.objects.get(cpf=CPF_ENFERMEIRO_PRE)
    enfermeiro_coleta = Enfermeiro.objects.get(cpf=CPF_ENFERMEIRO_COLETA)
    medico = Medico.objects.get(cpf=CPF_MEDICO)
    perguntas = list(Pergunta.objects.filter(ativa=True).order_by('pk'))
    if not perguntas:
        raise RuntimeError('As perguntas de triagem devem existir antes do seed de demonstracao.')

    tipos = {
        f'{tipo.tipo}{tipo.fator_rh}': tipo
        for tipo in TipoSanguineo.objects.all()
    }

    # Remove exclusivamente as duas bolsas defeituosas das migrations antigas.
    caminhos_legados = [
        'laudos_bolsas/2026/09/26/LAUDO_20260926_01.pdf',
        'laudos_bolsas/2026/09/26/LAUDO_20260926_02.pdf',
    ]
    processos_legados = list(
        Bolsa.objects.filter(arquivo_laudo__in=caminhos_legados).values_list(
            'processo_id', flat=True,
        )
    )
    Bolsa.objects.filter(arquivo_laudo__in=caminhos_legados).delete()
    for processo_id in processos_legados:
        processo = Processo.objects.filter(
            pk=processo_id,
            questionario__isnull=True,
        )
        if not Bolsa.objects.filter(processo_id=processo_id).exists():
            processo.delete()
    DadosClinicos.objects.filter(status_clinico=2).update(
        status_clinico=STATUS_CLINICO_APTO,
    )

    def criar_fluxo(
        *, chave, cpf, dias_atras, status_bolsa, tipo_sigla=None,
        vencimento=None, laudo=True,
    ):
        doador = doadores[cpf]
        data_processo = hoje - timedelta(days=dias_atras)
        data_questionario = _instante(data_processo, 8)
        data_inicio = _instante(data_processo, 9)
        questionario = _obter_ou_criar_questionario(
            Questionario, doador, data_questionario, True,
        )
        _preencher_respostas(Resposta, perguntas, questionario)
        processo = _obter_ou_criar_processo(
            Processo, questionario, doador, recepcionista,
            STATUS_PROCESSO_CONCLUIDO, data_inicio,
        )
        _criar_dados_clinicos(
            DadosClinicos, EnfermeiroDados, MedicoDados, processo, doador,
            enfermeiro_pre, enfermeiro_coleta, medico,
            STATUS_CLINICO_APTO,
        )

        aguardando = status_bolsa == STATUS_BOLSA_AGUARDANDO
        defaults = {
            'doador': doador,
            'tipo_sanguineo': None if aguardando else tipos[tipo_sigla],
            'enfermeiro_coleta': enfermeiro_coleta,
            'medico_validacao': None if aguardando else medico,
            'status': status_bolsa,
            'data_vencimento': None if aguardando else vencimento,
            'validacao_at': None if aguardando else data_inicio + timedelta(hours=3),
            'arquivo_laudo': (
                f'laudos_bolsas/demonstracao/{chave}.pdf' if laudo else ''
            ),
        }
        Bolsa.objects.update_or_create(processo=processo, defaults=defaults)
        return processo

    principais_historicos = [
        ('11732693200', 'a_positivo'),
        ('10100000207', 'b_positivo'),
        ('10100000630', 'o_positivo'),
    ]
    historico = [
        ('utilizada', 370, STATUS_BOLSA_UTILIZADO),
        ('inapta', 280, STATUS_BOLSA_INAPTO),
        ('vencida', 190, STATUS_BOLSA_VALIDADO),
        ('aguardando', 100, STATUS_BOLSA_AGUARDANDO),
    ]
    for cpf, prefixo in principais_historicos:
        item = next(d for d in DOADORES_PRINCIPAIS if d['cpf'] == cpf)
        tipo_sigla = f"{item['tipo']}{item['rh']}"
        for estado, dias, status_bolsa in historico:
            criar_fluxo(
                chave=f'{prefixo}_{estado}',
                cpf=cpf,
                dias_atras=dias,
                status_bolsa=status_bolsa,
                tipo_sigla=tipo_sigla,
                vencimento=(hoje - timedelta(days=1)),
                laudo=status_bolsa != STATUS_BOLSA_AGUARDANDO,
            )

    estoque_atual = [
        ('11732693200', 'a_positivo_atual', 'A+'),
        *[
            (item['cpf'], f'a_positivo_apoio_{indice:02d}', 'A+')
            for indice, item in enumerate(
                [d for d in DOADORES_APOIO if d['tipo'] == 'A'], start=1
            )
        ],
        ('10100000207', 'b_positivo_atual', 'B+'),
        *[
            (item['cpf'], f'b_positivo_apoio_{indice:02d}', 'B+')
            for indice, item in enumerate(
                [d for d in DOADORES_APOIO if d['tipo'] == 'B'], start=1
            )
        ],
        ('10100000630', 'o_positivo_atual', 'O+'),
        ('10100002250', 'o_positivo_apoio_01', 'O+'),
        ('78974427214', 'o_negativo_atual', 'O-'),
    ]
    for cpf, chave, tipo_sigla in estoque_atual:
        dias_para_vencer = 5 if chave == 'a_positivo_atual' else 20
        criar_fluxo(
            chave=chave,
            cpf=cpf,
            dias_atras=10,
            status_bolsa=STATUS_BOLSA_VALIDADO,
            tipo_sigla=tipo_sigla,
            vencimento=hoje + timedelta(days=dias_para_vencer),
        )

    # Cenario impeditivo: fica em triagem e possui uma resposta divergente.
    doador_invalido = doadores['10100000126']
    data_invalida = hoje - timedelta(days=2)
    questionario_invalido = _obter_ou_criar_questionario(
        Questionario, doador_invalido, _instante(data_invalida, 8), False,
    )
    _preencher_respostas(
        Resposta,
        perguntas,
        questionario_invalido,
        pergunta_impeditiva='Voce esta sentindo-se bem e com saude hoje?',
    )
    # Garante uma divergencia mesmo se o texto estiver acentuado no banco.
    pergunta_impeditiva = perguntas[0]
    Resposta.objects.update_or_create(
        questionario=questionario_invalido,
        pergunta=pergunta_impeditiva,
        defaults={
            'resposta_texto': (
                'Nao' if pergunta_impeditiva.resposta_esperada == 'Sim' else 'Sim'
            ),
        },
    )
    processo_invalido = _obter_ou_criar_processo(
        Processo, questionario_invalido, doador_invalido, recepcionista,
        STATUS_PROCESSO_TRIAGEM, _instante(data_invalida, 9),
    )
    _criar_dados_clinicos(
        DadosClinicos, EnfermeiroDados, MedicoDados,
        processo_invalido, doador_invalido, enfermeiro_pre,
        enfermeiro_coleta, medico, STATUS_CLINICO_APTO,
        fluxo_completo=False,
    )

    for item in DOADORES_PRINCIPAIS:
        quantidade = 2 if item['cpf'] in {
            '11732693200', '10100000207', '10100000630'
        } else 1
        for indice in range(1, quantidade + 1):
            nome = f'Exame demonstrativo {indice} - {item["tipo"]}{item["rh"]}'
            exame, _ = ExameDoador.objects.update_or_create(
                doador=doadores[item['cpf']],
                nome_arquivo=nome,
                defaults={
                    'arquivo': (
                        'exames_doador/demonstracao/'
                        f'exame_{item["cpf"]}_{indice}.pdf'
                    ),
                },
            )
            data_exame = _instante(
                hoje - timedelta(days=30 * indice), 10,
            )
            ExameDoador.objects.filter(pk=exame.pk).update(
                data_upload=data_exame,
            )


class Migration(migrations.Migration):
    dependencies = [
        ('administradores', '0002_auto_administradores_padrao'),
        ('bolsas', '0007_bolsa_operacional_exige_tipo'),
        ('core', '0003_tipo_sanguineo_constraints'),
        ('dados_clinicos', '0004_auto_dados_clinicos'),
        ('doadores', '0003_auto_20260301_1736'),
        ('enfermeiros', '0002_auto_20260301_1736'),
        ('exames_doador', '0002_initial'),
        ('medicos', '0002_auto_20260301_1736'),
        ('processos_doacao', '0004_atendimento_processo'),
        ('recepcionistas', '0002_auto_20260301_1736'),
        ('triagem', '0004_auto_20260301_1723'),
        ('usuarios', '0005_usuario_deve_alterar_senha'),
    ]

    operations = [
        migrations.RunPython(inserir_demonstracao, migrations.RunPython.noop),
    ]
