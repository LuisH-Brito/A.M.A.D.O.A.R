from django.db import migrations
from django.contrib.auth.hashers import make_password

def inserir_doadores(apps, schema_editor):
    Doador = apps.get_model('doadores', 'Doador')

    # O primeiro é o nosso "teste" que já usámos no Front-end
    Doador.objects.get_or_create(
        cpf="teste", 
        defaults={
            "username": "doador_teste",
            "nome_completo": "Usuário Teste",
            "email": "teste@doador.com",
            "password": make_password("senha123"), # Senha: senha123
            "sexo": "M",
            "telefone": "68999999999"
        }
    )

    Doador.objects.get_or_create(
        cpf="11111111111",
        defaults={
            "username": "Carlos_doador",
            "nome_completo": "Carlos Martins",
            "email": "carlos@doador.com",
            "password": make_password("senha123"),
            "sexo": "M",
            "telefone": "68988888888"
        }
    )

class Migration(migrations.Migration):
    dependencies = [
        ('doadores', '0002_doador_telefone'),
    ]
    operations = [
        migrations.RunPython(inserir_doadores),
    ]