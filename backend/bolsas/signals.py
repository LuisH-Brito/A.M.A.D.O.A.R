from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Bolsa

@receiver(post_save, sender=Bolsa)
def verificar_estoque_apos_uso(sender, instance, **kwargs):
    pass