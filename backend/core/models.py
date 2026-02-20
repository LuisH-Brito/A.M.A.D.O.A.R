from django.db import models
from choices import TipoSanguineo, FatorRH

class Tipo_Sanguineo(models.Model):
    tipo = models.CharField(max_length=2, choices=TipoSanguineo.choices)
    fator_rh = models.CharField(max_length=1, choices=FatorRH.choices)

    def __str__(self):
        return f"{self.tipo}{self.fator_rh}"
