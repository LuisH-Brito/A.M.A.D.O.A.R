from django.db import migrations

def inserir_perguntas_iniciais(apps, schema_editor):
    Pergunta = apps.get_model('triagem', 'Pergunta') 

    lista_de_perguntas = [
        # SAÚDE BÁSICA E ALIMENTAÇÃO
        {"texto": "Você está sentindo-se bem e com saúde hoje?", "resposta_esperada": "Sim", "motivo_inaptidao": "O doador deve estar em pleno estado de saúde para doar."},
        {"texto": "Você dormiu pelo menos 6 horas na última noite?", "resposta_esperada": "Sim", "motivo_inaptidao": "Fadiga ou falta de sono aumentam o risco de desmaio durante a doação."},
        {"texto": "Você pesa mais de 50 kg?", "resposta_esperada": "Sim", "motivo_inaptidao": "O peso mínimo de 50 kg é obrigatório para que o volume de sangue coletado seja seguro."},
        {"texto": "Você se alimentou de forma saudável nas últimas 4 horas? (Sem jejum prolongado e sem comidas muito gordurosas)", "resposta_esperada": "Sim", "motivo_inaptidao": "Jejum prolongado aumenta o risco de fraqueza e síncope (desmaio)."},
        {"texto": "Você consumiu alguma bebida alcoólica nas últimas 12 horas?", "resposta_esperada": "Não", "motivo_inaptidao": "A ingestão de álcool inabilita temporariamente a doação devido à intoxicação do sangue."},

        # SINTOMAS RECENTES E DOENÇAS AGUDAS
        {"texto": "Você teve febre, gripe, resfriado ou tosse nos últimos 7 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "É necessário aguardar 7 dias após o fim dos sintomas para descartar infecções virais."},
        {"texto": "Você teve diarreia nos últimos 7 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "Quadros de diarreia exigem 7 dias de janela de segurança após a cura para evitar contaminação bacteriana."},
        {"texto": "Você tomou antibiótico nos últimos 14 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "O uso recente de antibióticos indica infecção recente. É preciso aguardar 14 dias após o término do remédio."},
        {"texto": "Você teve dengue, zika ou chikungunya nos últimos 30 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "É necessário aguardar 30 dias após a recuperação completa (ou 120 dias em casos graves)."},

        # QUESTÕES PARA MULHERES
        {"texto": "Você está grávida ou suspeita de gravidez?", "resposta_esperada": "Não", "motivo_inaptidao": "A gravidez é um impedimento temporário absoluto para garantir a saúde da mãe e do bebê."},
        {"texto": "Você teve parto normal nos últimos 90 dias ou cesárea/aborto nos últimos 180 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "O corpo precisa de tempo para recuperar os estoques de ferro após partos ou abortos."},
        {"texto": "Você está amamentando um bebê com menos de 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "A doação durante a lactação exclusiva (até 12 meses) pode prejudicar a nutrição do bebê."},

        # PROCEDIMENTOS E CIRURGIAS
        {"texto": "Você fez extração dentária ou tratamento de canal nos últimos 7 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "Procedimentos odontológicos invasivos exigem 7 dias de espera pelo risco de bactérias na corrente sanguínea."},
        {"texto": "Você fez cirurgia de pequeno porte (ex: apendicite) nos últimos 3 meses ou grande porte nos últimos 6 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "O doador deve estar totalmente recuperado e cicatrizado de intervenções cirúrgicas."},
        {"texto": "Você fez endoscopia ou colonoscopia nos últimos 6 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "A introdução de sondas no corpo exige janela de segurança de 6 meses contra contaminações."},

        # PROCEDIMENTOS ESTÉTICOS
        {"texto": "Você fez tatuagem, micropigmentação ou maquiagem definitiva nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "Procedimentos com agulhas exigem janela de segurança de 12 meses devido ao risco de infecções transmitidas pelo sangue."},
        {"texto": "Você colocou piercing nos últimos 12 meses? (Nota: Piercing na boca ou genital é impedimento enquanto usar)", "resposta_esperada": "Não", "motivo_inaptidao": "A perfuração exige 12 meses de espera. Piercings em áreas de mucosa (boca/genital) geram inaptidão prolongada."},

        # VACINAS E MEDICAMENTOS ESPECÍFICOS
        {"texto": "Você tomou vacina para Gripe, Covid-19, Hepatite B ou Tétano nos últimos 7 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "Período necessário para a inativação da vacina no organismo (geralmente de 48h a 7 dias)."},
        {"texto": "Você tomou vacinas de vírus atenuado (Febre Amarela, Sarampo, Caxumba, Rubéola) nos últimos 30 dias?", "resposta_esperada": "Não", "motivo_inaptidao": "Vacinas de vírus vivos exigem janela de 4 semanas para não transmitir o vírus atenuado ao receptor."},
        {"texto": "Você já fez uso de medicamentos como Roacutan (Isotretinoína), Finasterida ou Tegretol?", "resposta_esperada": "Não", "motivo_inaptidao": "Estes medicamentos são teratogênicos (causam má formação fetal) e exigem avaliação médica e prazos específicos de espera."},

        # COMPORTAMENTO DE RISCO E ISTs
        {"texto": "Você teve relação sexual com pessoa com diagnóstico de HIV, Sífilis ou Hepatite B/C nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "Contato de risco exige janela imunológica mínima de 12 meses para segurança laboratorial."},
        {"texto": "Você teve relação sexual com novo parceiro(a) ou múltiplos parceiros(as) nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "A troca recente ou multiplicidade de parceiros exige cautela devido à janela imunológica de ISTs."},
        {"texto": "Você teve diagnóstico ou sintomas de Sífilis (Cancro duro) ou Gonorreia nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "É necessário aguardar 12 meses após a cura completa destas ISTs."},
        {"texto": "Você já fez uso de drogas ilícitas injetáveis ou inaladas (ex: cocaína) alguma vez na vida?", "resposta_esperada": "Não", "motivo_inaptidao": "O uso de drogas injetáveis gera inaptidão definitiva. Drogas inaladas geram inaptidão de 12 meses."},

        # HISTÓRICO MÉDICO GRAVE E ENDEMIAS
        {"texto": "Você já teve Hepatite após os 11 anos de idade?", "resposta_esperada": "Não", "motivo_inaptidao": "Histórico de hepatite viral após os 11 anos é causa de inaptidão definitiva para doação de sangue."},
        {"texto": "Você tem ou já teve diagnóstico de Doença de Chagas?", "resposta_esperada": "Não", "motivo_inaptidao": "O diagnóstico de Doença de Chagas é causa de inaptidão definitiva."},
        {"texto": "Você teve malária nos últimos 12 meses ou já esteve em região de surto recente no Norte do país?", "resposta_esperada": "Não", "motivo_inaptidao": "Em regiões endêmicas, o histórico recente de malária impede a doação temporariamente por 12 meses."},
        {"texto": "Você já recebeu transfusão de sangue, plasma ou plaquetas alguma vez na vida?", "resposta_esperada": "Não", "motivo_inaptidao": "Quem recebeu transfusão deve aguardar 12 meses devido ao risco de aloimunização ou doenças ocultas."},
        {"texto": "Você tem diagnóstico de câncer (exceto carcinoma basocelular de pele já curado)?", "resposta_esperada": "Não", "motivo_inaptidao": "Histórico de câncer (neoplasias malignas) é impedimento definitivo na maioria dos casos."},
        {"texto": "Você sofre de epilepsia ou teve convulsões após os 2 anos de idade?", "resposta_esperada": "Não", "motivo_inaptidao": "A doação de sangue pode desencadear crises convulsivas em pessoas com este histórico."},
        {"texto": "Você é diabético e faz uso de insulina?", "resposta_esperada": "Não", "motivo_inaptidao": "Diabéticos dependentes de insulina têm inaptidão definitiva por questões vasculares."},
        {"texto": "Você tem problemas cardíacos graves (ex: infarto, arritmia severa, uso de marca-passo)?", "resposta_esperada": "Não", "motivo_inaptidao": "As alterações no volume de sangue são perigosas para pessoas com doenças cardiovasculares."},

        # OUTROS
        {"texto": "Você foi mordido por animal silvestre ou de rua e tomou vacina anti-rábica nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "Risco de infecção pela raiva ou janela imunológica da vacinação soroterápica."},
        {"texto": "Você esteve preso(a) ou encarcerado(a) por mais de 72 horas nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "O confinamento gera inaptidão temporária de 12 meses devido ao alto risco de transmissão de doenças no ambiente prisional."},
        {"texto": "Você realizou tratamento com acupuntura (sem descarte adequado de agulhas) nos últimos 12 meses?", "resposta_esperada": "Não", "motivo_inaptidao": "Risco de contaminação por uso de agulhas sem certificação de descarte único."}
    ]

    for p in lista_de_perguntas:
        Pergunta.objects.get_or_create(
            texto=p["texto"],
            defaults={
                "resposta_esperada": p["resposta_esperada"],
                "motivo_inaptidao": p["motivo_inaptidao"],
                "ativa": True
            }
        )

class Migration(migrations.Migration):

    dependencies = [
        ('triagem', '0003_pergunta_motivo_inaptidao_pergunta_resposta_esperada'),
    ]

    operations = [
        migrations.RunPython(inserir_perguntas_iniciais),
    ]