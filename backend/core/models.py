from django.db import models
from choices import TipoSanguineo, FatorRH

class Tipo_Sanguineo(models.Model):
    tipo = models.CharField(max_length=2, choices=TipoSanguineo.choices)
    fator_rh = models.CharField(max_length=1, choices=FatorRH.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['tipo', 'fator_rh'],
                name='tipo_sanguineo_abo_rh_unico',
            ),
            models.CheckConstraint(
                condition=models.Q(tipo__in=TipoSanguineo.values),
                name='tipo_sanguineo_abo_valido',
            ),
            models.CheckConstraint(
                condition=models.Q(fator_rh__in=FatorRH.values),
                name='tipo_sanguineo_rh_valido',
            ),
        ]

    def __str__(self):
        return f"{self.tipo}{self.fator_rh}"
