import os
from django.core.mail import send_mail
from django.conf import settings
from doadores.models import Doador
from core.models import Tipo_Sanguineo

def notificar_doadores_por_tipo(tipo_sigla):
    """
    Recebe a sigla (ex: 'A+', 'O-') e notifica apenas os doadores desse tipo.
    """
    if len(tipo_sigla) < 2:
        raise ValueError("Sigla de tipo sanguíneo inválida.")
        
    tipo = tipo_sigla[:-1]
    fator_rh = tipo_sigla[-1]
    
    tipo_sangue = Tipo_Sanguineo.objects.filter(tipo=tipo, fator_rh=fator_rh).first()
    if not tipo_sangue:
        raise ValueError(f"Tipo sanguíneo {tipo_sigla} não encontrado no banco.")
        
    doadores = Doador.objects.filter(
        tipo_sanguineo_declarado=tipo_sangue.tipo, 
        fator_rh=tipo_sangue.fator_rh
    )
    
    lista_emails = [d.email for d in doadores if d.email]

    if not lista_emails:
        return 0 # Ninguém para notificar

    send_mail(
        subject=f'🚨 ESTOQUE CRÍTICO: Sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh}',
        message=f'O estoque de sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh} está baixo. Precisamos de você!',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=lista_emails,
        fail_silently=False,
        html_message=f"""
            <h3>O estoque de sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh} está baixo!</h3>
            <p>Olá, doador! Identificamos que o estoque do seu tipo sanguíneo atingiu um nível crítico no hemocentro.</p>
            <p>Sua doação é fundamental para continuarmos a salvar vidas. Se puder, faça-nos uma visita e doe!</p>
            <br>
            <p>Atenciosamente,<br>Equipe A.M.A.D.O.A.R</p>
        """
    )
    return len(lista_emails)