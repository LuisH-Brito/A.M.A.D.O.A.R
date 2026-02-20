from django.db import models
from usuarios.models import Usuario 

class Medico(Usuario):
    crm = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"Dr(a). {self.nome_completo} - CRM: {self.crm}"