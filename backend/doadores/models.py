from datetime import timedelta
from django.utils import timezone

from django.db import models
from django.dispatch import receiver
from usuarios.models import Usuario 
from choices import Sexo, StatusProcesso, TipoSanguineo, FatorRH
from django.db.models.signals import post_delete
from django.dispatch import receiver
import os

class Doador(Usuario):
    sexo = models.CharField(max_length=1, choices=Sexo.choices) 
    tipo_sanguineo_declarado = models.CharField(max_length=2, choices=TipoSanguineo.choices, null=True, blank=True)
    fator_rh = models.CharField(max_length=1, choices=FatorRH.choices, null=True, blank=True)
    carteira_doador = models.ImageField(upload_to='carteiras/', null=True, blank=True)  # O ImageField garante que o arquivo é uma imagem real e gerencia o upload ( coisa de django )
    telefone = models.CharField(max_length=20)
    
    def __str__(self):
        return f"Doador: {self.nome_completo}"
    
  
    @property
    def data_proxima_doacao(self):
        ultimo_concluido = self.processos.filter(status=StatusProcesso.CONCLUIDO).order_by('-data_inicio').first()
        
        if not ultimo_concluido:
            return None
            
        dias_espera = 60 if self.sexo == 'M' else 90
        return (ultimo_concluido.data_inicio + timedelta(days=dias_espera)).date()

    @property
    def apto_para_doacao(self):
        processo_em_andamento = self.processos.exclude(
            status__in=[StatusProcesso.CONCLUIDO, StatusProcesso.CANCELADO]
        ).exists()
        
        if processo_em_andamento:
            return False

        data_liberacao = self.data_proxima_doacao
        if data_liberacao:
            return timezone.now().date() >= data_liberacao
            
        return True

    @property
    def data_ultima_doacao(self):
        ultimo_concluido = self.processos.filter(status=StatusProcesso.CONCLUIDO).order_by('-data_inicio').first()
        return ultimo_concluido.data_inicio.date() if ultimo_concluido else None

@receiver(post_delete, sender=Doador)
def deletar_arquivo_carteira(sender, instance, **kwargs):
    if instance.carteira_doador:
        caminho_arquivo = instance.carteira_doador.path
        if os.path.isfile(caminho_arquivo):
             os.remove(caminho_arquivo)
