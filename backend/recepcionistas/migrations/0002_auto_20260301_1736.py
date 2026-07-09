from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_recepcionistas(apps, schema_editor):
    Recepcionista = apps.get_model('recepcionistas', 'Recepcionista')

    Recepcionista.objects.get_or_create(
        cpf="04692461209",
        defaults={

            "nome_completo": "Tânia Sara Alana Cavalcanti",
            "email": "tania_sara_cavalcanti@pciinformatica.com",
            "password": make_password("senha123"),
            "data_nascimento": "2001-03-26",
            "endereco": "Rua Cruzeiro do Sul, 590, Floresta, Rio Branco, Acre."
        }
    )

    Recepcionista.objects.get_or_create(
        cpf="77513196230",
        defaults={
   
            "nome_completo": "Nathan Carlos Eduardo da Mata",
            "email": "nathan_carlos_damata@imobiliariamaciel.com.br",
            "password": make_password("senha123"),
            "data_nascimento": "2002-07-14",
            "endereco": "Rua Novo Horizonte, 120, Nova Estação, Rio Branco, Acre."
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('recepcionistas', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_recepcionistas),
    ]