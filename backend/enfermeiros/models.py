from django.db import models
from usuarios.models import Usuario 

class Enfermeiro(Usuario):
    coren = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.nome_completo} - COREN: {self.coren}"