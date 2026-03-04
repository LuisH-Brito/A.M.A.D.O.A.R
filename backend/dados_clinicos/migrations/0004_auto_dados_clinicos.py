from django.db import migrations

def inserir_dados_clinicos(apps, schema_editor):
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    Dados_Clinicos = apps.get_model('dados_clinicos', 'Dados_Clinicos')
    MedicoDados = apps.get_model('dados_clinicos', 'MedicoDados')
    EnfermeiroDados = apps.get_model('dados_clinicos', 'EnfermeiroDados')

    APTO = 2 

    try:
        processo_concluido = Processo_Doacao.objects.get(doador_id=1)
    except Processo_Doacao.DoesNotExist:
        print("Aviso: Processo do Doador 1 não encontrado. Abortando inserção.")
        return

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
        # Enfermeiro 1 (Pré-Triagem)
        EnfermeiroDados.objects.get_or_create(
            enfermeiro_id=3,
            dados=dados,
            papel='PRE_TRIAGEM'
        )

        # Médico (Triagem)
        MedicoDados.objects.get_or_create(
            medico_id=5,
            dados=dados,
            papel='TRIAGEM'
        )

        # Enfermeiro 2 (Coleta)
        EnfermeiroDados.objects.get_or_create(
            enfermeiro_id=4,
            dados=dados,
            papel='COLETA'
        )

class Migration(migrations.Migration):
    dependencies = [
        ('dados_clinicos', '0003_initial'),
        ('processos_doacao', '0003_auto_processos'), 
    ]
    operations = [
        migrations.RunPython(inserir_dados_clinicos),
    ]