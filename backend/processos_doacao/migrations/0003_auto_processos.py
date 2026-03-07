from django.db import migrations

def inserir_processos(apps, schema_editor):
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    Doador = apps.get_model('doadores', 'Doador')
    Recepcionista = apps.get_model('recepcionistas', 'Recepcionista')
    
    RECEPCAO = 1  
    CONCLUIDO = 5 

    # 1. Buscar registros existentes de forma dinâmica em vez de usar ID fixo
    doadores = Doador.objects.all()
    recepcionistas = Recepcionista.objects.all()

    if not doadores.exists() or not recepcionistas.exists():
        print("\n[Aviso] Pulando criação de processos: Doadores ou Recepcionistas não encontrados.")
        return

    primeiro_doador = doadores.first()
    primeiro_recep = recepcionistas.first()

    Processo_Doacao.objects.get_or_create(
        doador=primeiro_doador,
        defaults={
            'recepcionista': primeiro_recep,
            'questionario_id': None, 
            'status': CONCLUIDO,
        }
    )

    if doadores.count() > 1:
        segundo_doador = doadores[1]
        Processo_Doacao.objects.get_or_create(
            doador=segundo_doador,
            defaults={
                'recepcionista': primeiro_recep,
                'questionario_id': None, 
                'status': RECEPCAO,
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('processos_doacao', '0002_initial'),
        ('recepcionistas', '0002_auto_20260301_1736'),
        ('doadores', '0003_auto_20260301_1736'),
    ]
    operations = [
        migrations.RunPython(inserir_processos),
    ]