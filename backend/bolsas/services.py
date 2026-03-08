import os
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count
from .models import Bolsa
from doadores.models import Doador
from core.models import Tipo_Sanguineo

def notificar_estoque_critico():
    # Filtra bolsas disponíveis (status=2) e agrupa por tipo sanguíneo
    # O 'status=2' garante que a bolsa já foi validada pelo médico
    estoque = (Bolsa.objects.filter(status=2)
               .values('tipo_sanguineo')
               .annotate(total=Count('id')))
    
    LIMITE_CRITICO = 2

    for item in estoque:
        if item['total'] < LIMITE_CRITICO:
            # Busca o objeto do tipo sanguíneo para comparar os campos
            tipo_sangue = Tipo_Sanguineo.objects.get(id=item['tipo_sanguineo'])
            
            doadores = Doador.objects.filter(
                tipo_sanguineo_declarado=tipo_sangue.tipo, 
                fator_rh=tipo_sangue.fator_rh
            )
            
            lista_emails = [d.email for d in doadores if d.email]

            if lista_emails:
                try:
                    
                    send_mail(
                        subject=f'🚨 ESTOQUE CRÍTICO: Sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh}',
                        message=f'O estoque de sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh} está baixo. Precisamos de você!',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=lista_emails,
                        fail_silently=False,
                        html_message=f"""
                            <h3>O estoque de sangue {tipo_sangue.tipo}{tipo_sangue.fator_rh} está baixo!</h3>
                            <p>Olá, doador! Identificamos que o estoque do seu tipo sanguíneo atingiu um nível crítico.</p>
                            <p>Sua doação é fundamental para mantermos o Hemocentro operando. Se puder, agende uma doação!</p>
                            <br>
                            <p>Atenciosamente,<br>Equipe A.M.A.D.O.A.R</p>
                        """
                    )
                    print(f"Notificações enviadas para o tipo {tipo_sangue}")
                except Exception as e:
                    print(f"Erro ao enviar e-mail via Gmail para tipo {tipo_sangue}: {e}")