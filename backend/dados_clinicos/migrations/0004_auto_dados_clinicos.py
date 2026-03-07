from django.db import migrations

def inserir_dados_clinicos(apps, schema_editor):
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    Dados_Clinicos = apps.get_model('dados_clinicos', 'Dados_Clinicos')
    MedicoDados = apps.get_model('dados_clinicos', 'MedicoDados')
    EnfermeiroDados = apps.get_model('dados_clinicos', 'EnfermeiroDados')
    
    # Modelos para buscar os usuários reais
    Enfermeiro = apps.get_model('enfermeiros', 'Enfermeiro')
    Medico = apps.get_model('medicos', 'Medico')

    APTO = 2 

    # Buscar o processo de forma dinâmica
    processo_concluido = Processo_Doacao.objects.first()
    
    if not processo_concluido:
        print("Aviso: Nenhum Processo de Doação encontrado. Abortando inserção de dados clínicos.")
        return

    #  Buscar Enfermeiros e Médicos reais
    enfermeiro_1 = Enfermeiro.objects.first()
    # Pega o último enfermeiro para ser o da coleta, ou usa o mesmo se só houver um
    enfermeiro_2 = Enfermeiro.objects.last() 
    medico = Medico.objects.first()

    if not enfermeiro_1 or not medico:
        print("Aviso: Enfermeiro ou Médico não encontrado. Abortando inserção de dados clínicos.")
        return

    #  Criar os Dados Clínicos
    dados, created = Dados_Clinicos.objects.get_or_create(
        processo=processo_concluido,
        defaults={
            'peso': 78.5,
            'altura': 1.75,
            'hemoglobina': 14.2,
            'pressao_arterial': '120/80',
            'status_clinico': APTO,
        }
    )

    if created:
        # Enfermeiro (Pré-Triagem)
        EnfermeiroDados.objects.get_or_create(
            enfermeiro=enfermeiro_1,
            dados=dados,
            defaults={'papel': 'PRE_TRIAGEM'}
        )

        # Médico (Triagem)
        MedicoDados.objects.get_or_create(
            medico=medico,
            dados=dados,
            defaults={'papel': 'TRIAGEM'}
        )

        # Enfermeiro (Coleta)
        EnfermeiroDados.objects.get_or_create(
            enfermeiro=enfermeiro_2,
            dados=dados,
            defaults={'papel': 'COLETA'}
        )
        print("Dados clínicos inseridos com sucesso!")

class Migration(migrations.Migration):
    dependencies = [
        ('dados_clinicos', '0003_initial'), 
        ('processos_doacao', '0003_auto_processos'), 
        ('enfermeiros', '0002_auto_20260301_1736'),
        ('medicos', '0002_auto_20260301_1736'),
    ]
    operations = [
        migrations.RunPython(inserir_dados_clinicos),
    ]