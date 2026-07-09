from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_doadores(apps, schema_editor):
    Doador = apps.get_model('doadores', 'Doador')

    # O primeiro é o nosso "teste" que já usámos no Front-end
    Doador.objects.get_or_create(
        cpf="11732693200", 
        defaults={
            "nome_completo": "Giovanni Ruan Renato Alves",
            "email": "giovanni_alves@live.ca",
            "password": make_password("senha123"), # Senha: senha123
            "sexo": "M",
            "telefone": "68995372378",
            "data_nascimento": "2002-04-16",
            "endereco": "Rua Alameda Grécia, 67, Jardim Europa, Rio Branco, Acre.",
            "tipo_sanguineo_declarado": "A",
            "fator_rh": "+"
        }
    )

    Doador.objects.get_or_create(
        cpf="78974427214",
        defaults={
            "nome_completo": "Louise Luzia Assunção",
            "email": "louise_assuncao@europamotors.com.br",
            "password": make_password("senha123"),
            "sexo": "F",
            "telefone": "68989669621",
            "data_nascimento": "2003-06-04",
            "endereco": "Rua Belém, 595, Conjunto Xavier Maia, Rio Branco, Acre.",
            "tipo_sanguineo_declarado": "O",
            "fator_rh": "-"
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('doadores', '0001_initial'),
    ]
    operations = [
        migrations.RunPython(inserir_doadores),
    ]