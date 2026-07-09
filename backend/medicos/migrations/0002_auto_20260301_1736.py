from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_medicos(apps, schema_editor):
    Medico = apps.get_model('medicos', 'Medico')

    Medico.objects.get_or_create(
        cpf="97042023269",
        defaults={

            "nome_completo": "Jorge Benedito Cardoso",
            "email": "jorge_cardoso@dc4.com.br",
            "password": make_password("senha123"),
            "data_nascimento": "1989-09-29",
            "endereco": "Rua Sete de Setembro, 89, Manoel Julião, Rio Branco, Acre.",
            "crm": "CRM-AC-90420"
        }
    )

    Medico.objects.get_or_create(
        cpf="59713131266",
        defaults={

            "nome_completo": "Mariana Teresinha Fogaça",
            "email": "mariana_teresinha_fogaca@cognis.com",
            "password": make_password("senha123"),
            "data_nascimento": "1989-09-29",
            "endereco": "Rua São Francisco, 76, Conjunto Tangara, Rio Branco, Acre.",
            "crm": "CRM-AC-59713"
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('medicos', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_medicos),
    ]