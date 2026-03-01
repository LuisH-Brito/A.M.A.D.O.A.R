from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_recepcionistas(apps, schema_editor):
    Recepcionista = apps.get_model('recepcionistas', 'Recepcionista')

    Recepcionista.objects.get_or_create(
        cpf="66666666666",
        defaults={
            "username": "samuel_recep",
            "nome_completo": "Samuel Dias",
            "email": "samuel@hemoacre.com",
            "password": make_password("senha123")
        }
    )

    Recepcionista.objects.get_or_create(
        cpf="77777777777",
        defaults={
            "username": "isac_recep",
            "nome_completo": "Isac Costa",
            "email": "isac@hemoacre.com",
            "password": make_password("senha123")
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('recepcionistas', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_recepcionistas),
    ]