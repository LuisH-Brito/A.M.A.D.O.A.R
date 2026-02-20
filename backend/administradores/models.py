from django.db import models
from usuarios.models import Usuario

class Administrador(Usuario):
    
    def __str__(self):
        return f"Adm: {self.nome_completo}"