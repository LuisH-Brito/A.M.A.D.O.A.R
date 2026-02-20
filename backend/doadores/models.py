from django.db import models
from usuarios.models import Usuario 
from choices import Sexo, TipoSanguineo, FatorRH

class Doador(Usuario):
    sexo = models.CharField(max_length=1, choices=Sexo.choices, null=True, blank=True) 
    tipo_sanguineo_declarado = models.CharField(max_length=2, choices=TipoSanguineo.choices, null=True, blank=True)
    fator_rh = models.CharField(max_length=1, choices=FatorRH.choices, null=True, blank=True)
    carteira_doador = models.ImageField(upload_to='carteiras/', null=True, blank=True)  # O ImageField garante que o arquivo é uma imagem real e gerencia o upload ( coisa de django )
    
    def __str__(self):
        return f"Doador: {self.nome_completo}"
