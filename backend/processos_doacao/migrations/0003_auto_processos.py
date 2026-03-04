from django.db import migrations

def inserir_processos(apps, schema_editor):
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    RECEPCAO = 1  
    CONCLUIDO = 5 

    # 1. Processo Concluído (Doador 1)
    Processo_Doacao.objects.get_or_create(
        doador_id=1,
        defaults={
            'recepcionista_id': 7,
            'questionario_id': 1, 
            'status': CONCLUIDO,
        }
    )

    # 2. Processo Inicial (Doador 2)
    Processo_Doacao.objects.get_or_create(
        doador_id=2,
        defaults={
            'recepcionista_id': 8,
            'questionario_id': None, 
            'status': RECEPCAO,
        }
    )


class Migration(migrations.Migration):
    dependencies = [
        ('processos_doacao', '0002_initial'), 
    ]
    operations = [
        migrations.RunPython(inserir_processos),
    ]