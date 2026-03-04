from django.db import migrations
from django.utils import timezone
import datetime

def inserir_bolsas(apps, schema_editor):
    Bolsa = apps.get_model('bolsas', 'Bolsa')
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    Tipo_Sanguineo = apps.get_model('core', 'Tipo_Sanguineo') 

    STATUS_VALIDADO = 2
    hoje = timezone.now()
    vencimento_padrao = hoje.date() + datetime.timedelta(days=35) 

    tipo_a_pos = Tipo_Sanguineo.objects.filter(tipo='A', fator_rh='+').first()
    tipo_o_neg = Tipo_Sanguineo.objects.filter(tipo='O', fator_rh='-').first()

    if not tipo_a_pos or not tipo_o_neg:
        print("\n[Aviso] Tipos sanguíneos base não encontrados. Abortando criação de bolsas.")
        return

    # Bolsa 1 - Doador 1 
    try:
        processo_1 = Processo_Doacao.objects.get(doador_id=1)
        Bolsa.objects.get_or_create(
            processo=processo_1,
            doador_id=1,
            defaults={
                'tipo_sanguineo': tipo_a_pos,
                'enfermeiro_coleta_id': 3,
                'medico_validacao_id': 5,
                'status': STATUS_VALIDADO,
                'data_vencimento': vencimento_padrao,
                'validacao_at': hoje,
            }
        )
    except Processo_Doacao.DoesNotExist:
        pass

    # Bolsa 2 - Doador 2 
    try:
        processo_2 = Processo_Doacao.objects.get(doador_id=2)
        Bolsa.objects.get_or_create(
            processo=processo_2,
            doador_id=2,
            defaults={
                'tipo_sanguineo': tipo_o_neg,
                'enfermeiro_coleta_id': 4,
                'medico_validacao_id': 5,
                'status': STATUS_VALIDADO,
                'data_vencimento': vencimento_padrao,
                'validacao_at': hoje,
            }
        )
    except Processo_Doacao.DoesNotExist:
        pass


class Migration(migrations.Migration):
    dependencies = [
        ('bolsas', '0002_initial'),
        ('processos_doacao', '0003_auto_processos'), 
        ('core', '0002_auto_tipos_sanguineos'), 
    ]
    operations = [
        migrations.RunPython(inserir_bolsas),
    ]