from django.contrib.auth.models import AbstractUser
from django.db import models

class Usuario(AbstractUser):
    cpf = models.CharField(max_length=14, unique=True)
    endereco = models.CharField(max_length=255)
    data_nascimento = models.DateField(null=True, blank=True)
    nome_completo = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.nome_completo} ({self.cpf})"