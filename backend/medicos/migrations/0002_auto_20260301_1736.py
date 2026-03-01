from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_medicos(apps, schema_editor):
    Medico = apps.get_model('medicos', 'Medico')

    Medico.objects.get_or_create(
        cpf="44444444444",
        defaults={
            "username": "dr_luis",
            "nome_completo": " Luís Henrique",
            "email": "luis@hemoacre.com",
            "password": make_password("senha123"),
            "crm": "CRM-AC-1111"
        }
    )

    Medico.objects.get_or_create(
        cpf="55555555555",
        defaults={
            "username": "dra_cleude",
            "nome_completo": "Claudia Ferreira",
            "email": "claude@hemoacre.com",
            "password": make_password("senha123"),
            "crm": "CRM-AC-2222"
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('medicos', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_medicos),
    ]