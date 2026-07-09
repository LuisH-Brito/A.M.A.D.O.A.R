from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_administradores(apps, schema_editor):
    Administrador = apps.get_model('administradores', 'Administrador')

    Administrador.objects.get_or_create(
        cpf="adm", 
        defaults={
            "nome_completo": "Administrador Principal",
            "email": "admin@amadoar.com",
            "password": make_password("senha123"),
            "is_staff": True,      
            "is_superuser": True,  
            "is_active": True
        }
    )

    Administrador.objects.get_or_create(
        cpf="77590978248",
        defaults={
            "nome_completo": "Cauê Geraldo Geraldo da Paz",
            "email": "cauegeraldodapaz@novaes.me",
            "password": make_password("senha123"),
            "data_nascimento": "1997-05-18",
            "endereco": "BR-364, Km 04, Distrito Industrial, Rio Branco, Acre.",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True
        }
    )

class Migration(migrations.Migration):

    dependencies = [
        ('administradores', '0001_initial'), 
    ]

    operations = [
        migrations.RunPython(inserir_administradores),
    ]