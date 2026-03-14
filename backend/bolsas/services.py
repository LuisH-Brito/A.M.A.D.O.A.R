import threading
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from doadores.models import Doador

# 1. A THREAD FAZ A CONEXÃO COM A INTERNET E ENVIA O E-MAIL, SEM ATRAPALHAR O FLUXO NORMAL DO SISTEMA
def enviar_email_em_background(mensagem_email):
    try:
        mensagem_email.send()
        print("✅ E-mails disparados com sucesso em segundo plano!")
    except Exception as e:
        print(f"❌ Erro ao enviar e-mails em segundo plano: {e}")

def notificar_doadores_por_tipo(tipo_sigla, apenas_aptos=False):
    if len(tipo_sigla) < 2:
        raise ValueError("Sigla de tipo sanguíneo inválida.")
        
    tipo = tipo_sigla[:-1]
    fator_rh = tipo_sigla[-1]
    
    # BUSCA OTIMIZADA: O 'prefetch_related' carrega os processos de todos de uma vez, 
    # deixando a verificação do 'apto_para_doacao' instantânea
    doadores = Doador.objects.prefetch_related('processos').filter(
        tipo_sanguineo_declarado=tipo, 
        fator_rh=fator_rh
    ).exclude(email__isnull=True).exclude(email__exact='')
    
    if apenas_aptos:
        lista_emails = [doador.email for doador in doadores if doador.apto_para_doacao]
    else:
        lista_emails = list(doadores.values_list('email', flat=True))

    qtd_emails = len(lista_emails)

    if qtd_emails == 0:
        return 0

    subject = f'🚨 ESTOQUE CRÍTICO: Sangue {tipo_sigla}'
    text_message = f'O estoque de sangue {tipo_sigla} está baixo. Precisamos de você!'
    html_message = f"""
        <h3>O estoque de sangue {tipo_sigla} está baixo!</h3>
        <p>Olá, doador! Identificamos que o estoque do seu tipo sanguíneo atingiu um nível crítico no hemocentro.</p>
        <p>Sua doação é fundamental para continuarmos a salvar vidas. Você já cumpriu o intervalo necessário e está apto. Se puder, faça-nos uma visita e doe!</p>
        <br>
        <p>Atenciosamente,<br>Equipe A.M.A.D.O.A.R</p>
    """

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.DEFAULT_FROM_EMAIL], 
        bcc=lista_emails 
    )
    msg.attach_alternative(html_message, "text/html")

    thread_envio = threading.Thread(target=enviar_email_em_background, args=(msg,))
    thread_envio.start()
    return qtd_emails