from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bolsa
from .services import notificar_estoque_critico

@receiver(post_save, sender=Bolsa)
def verificar_estoque_apos_uso(sender, instance, **kwargs):
    """
    Sempre que uma bolsa for salva, este código roda.
    Se o status for 3 (Inapto) ou 4 (Utilizado), chamamos a notificação.
    """
    if instance.status in [3, 4]:
        print(f"Bolsa {instance.id} saiu do estoque. Verificando níveis críticos...")
        notificar_estoque_critico()