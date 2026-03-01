from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_enfermeiros(apps, schema_editor):
    Enfermeiro = apps.get_model('enfermeiros', 'Enfermeiro')

    Enfermeiro.objects.get_or_create(
        cpf="22222222222",
        defaults={
            "username": "kelvin_enf",
            "nome_completo": "Kelvin Moreira",
            "email": "kelvin@hemoacre.com",
            "password": make_password("senha123"),
            "coren": "COREN-AC-12345"
        }
    )

    Enfermeiro.objects.get_or_create(
        cpf="33333333333",
        defaults={
            "username": "hayssa_enf",
            "nome_completo": "Hayssa Oliveira",
            "email": "hayssa@hemoacre.com",
            "password": make_password("senha123"),
            "coren": "COREN-AC-67890"
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('enfermeiros', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_enfermeiros),
    ]