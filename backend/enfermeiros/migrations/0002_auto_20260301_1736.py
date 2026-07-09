from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_enfermeiros(apps, schema_editor):
    Enfermeiro = apps.get_model('enfermeiros', 'Enfermeiro')

    Enfermeiro.objects.get_or_create(
        cpf="32952616280",
        defaults={

            "nome_completo": "Vitória Aurora Viana",
            "email": "vitoria.aurora.viana@ruilacos.com.br",
            "password": make_password("senha123"),
            "data_nascimento": "1998-11-22",
            "endereco": "Av. Norte, 120, Conjunto Tucumã, Rio Branco, Acre.",
            "coren": "COREN-AC-12345"
        }
    )

    Enfermeiro.objects.get_or_create(
        cpf="08242133271",
        defaults={

            "nome_completo": "Caleb Tiago Osvaldo Nunes",
            "email": "caleb-nunes90@signa.net.br",
            "password": make_password("senha123"),
            "data_nascimento": "1996-12-02",
            "endereco": "Rua Itália, 480, Jardim Europa, Rio Branco, Acre.",
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