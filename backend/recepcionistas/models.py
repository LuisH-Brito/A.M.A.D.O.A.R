from django.db import models
from usuarios.models import Usuario

class Recepcionista(Usuario):

    def __str__(self):
        return f"Recepcionista: {self.nome_completo}"