from django.db import migrations
from django.utils import timezone
import datetime

def inserir_bolsas_validadas(apps, schema_editor):
    Bolsa = apps.get_model('bolsas', 'Bolsa')
    Processo_Doacao = apps.get_model('processos_doacao', 'Processo_Doacao')
    Tipo_Sanguineo = apps.get_model('core', 'Tipo_Sanguineo') 
    Enfermeiro = apps.get_model('enfermeiros', 'Enfermeiro')
    Medico = apps.get_model('medicos', 'Medico')

    STATUS_VALIDADO = 2
    hoje = timezone.now()
    vencimento_padrao = hoje.date() + datetime.timedelta(days=35) 

    # 1. Busca os tipos sanguíneos necessários
    tipo_a_pos = Tipo_Sanguineo.objects.filter(tipo='A', fator_rh='+').first()
    tipo_o_neg = Tipo_Sanguineo.objects.filter(tipo='O', fator_rh='-').first()

    # 2. Busca os usuários necessários (Enfermeiro e Médico são obrigatórios aqui)
    enfermeiro = Enfermeiro.objects.first()
    medico = Medico.objects.first()
    processos = Processo_Doacao.objects.all()

    if not tipo_a_pos or not tipo_o_neg:
        print("\n[Aviso] Tipos sanguíneos não encontrados.")
        return

    if not enfermeiro or not medico or not processos.exists():
        print("\n[Aviso] Faltam Enfermeiros, Médicos ou Processos. As bolsas não foram criadas.")
        return

    # 3. Criação das bolsas já com Médico e Status Validado
    # Bolsa 1
    Bolsa.objects.get_or_create(
        processo=processos[0],
        doador_id=processos[0].doador_id,
        defaults={
            'tipo_sanguineo': tipo_a_pos,
            'enfermeiro_coleta': enfermeiro,
            'medico_validacao': medico, # 🟢 Adicionado para validação
            'status': STATUS_VALIDADO,  # 🟢 Status 2 para aparecer no estoque
            'data_vencimento': vencimento_padrao,
            'validacao_at': hoje,
        }
    )

    # Bolsa 2 (se houver um segundo processo disponível)
    proc_2 = processos[1] if processos.count() > 1 else processos[0]
    Bolsa.objects.get_or_create(
        processo=proc_2,
        doador_id=proc_2.doador_id,
        defaults={
            'tipo_sanguineo': tipo_o_neg,
            'enfermeiro_coleta': enfermeiro,
            'medico_validacao': medico,
            'status': STATUS_VALIDADO,
            'data_vencimento': vencimento_padrao,
            'validacao_at': hoje,
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('bolsas', '0002_initial'),
        ('processos_doacao', '0003_auto_processos'), 
        ('core', '0002_auto_tipos_sanguineos'),
        ('medicos', '0002_auto_20260301_1736'), 
        ('enfermeiros', '0002_auto_20260301_1736'), 
    ]
    operations = [
        migrations.RunPython(inserir_bolsas_validadas),
    ]