from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UsuarioManager(BaseUserManager):

    def search_email_by_cpf(self, cpf: str):
        cpf_sem_mascara = ''.join(ch for ch in (cpf or '') if ch.isdigit())

        if len(cpf_sem_mascara) != 11:
            raise ValueError('O CPF está incorreto.')

        usuario = self.get_queryset().filter(cpf=cpf_sem_mascara).only('email').first()
        return usuario.email if usuario else None

    def create_user(self, cpf, password=None, **extra_fields):
        if not cpf:
            raise ValueError('O CPF é obrigatório')
        email = self.normalize_email(extra_fields.get('email'))
        extra_fields['email'] = email
        user = self.model(cpf=cpf, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, cpf, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser precisa ter is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser precisa ter is_superuser=True.')

        return self.create_user(cpf, password, **extra_fields)

class Usuario(AbstractUser):

    username = None
    first_name = None  
    last_name = None
    cpf = models.CharField(max_length=14, unique=True)
    endereco = models.CharField(max_length=255)
    data_nascimento = models.DateField(null=True, blank=True)
    nome_completo = models.CharField(max_length=255)
    objects = UsuarioManager()
    USERNAME_FIELD = 'cpf'
   

    def __str__(self):
        return f"{self.nome_completo} ({self.cpf})"