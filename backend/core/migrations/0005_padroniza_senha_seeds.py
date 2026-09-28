from django.contrib.auth.hashers import make_password
from django.db import migrations


SENHA_DEMONSTRACAO = 'senha123'

CPFS_DEMONSTRACAO = [
    '10100002331', '77590978248', '04692461209', '77513196230',
    '32952616280', '08242133271', '97042023269', '59713131266',
    '11732693200', '10100000126', '10100000207', '10100000398',
    '10100000479', '10100000550', '10100000630', '78974427214',
    '10100000983', '10100001017', '10100001106', '10100001289',
    '10100001360', '10100001440', '10100001521', '10100001602',
    '10100001793', '10100001874', '10100001955', '10100002099',
    '10100002170', '10100002250',
]


def padronizar_senhas(apps, schema_editor):
    Usuario = apps.get_model('usuarios', 'Usuario')
    Usuario.objects.filter(cpf__in=CPFS_DEMONSTRACAO).update(
        password=make_password(SENHA_DEMONSTRACAO),
        deve_alterar_senha=False,
        is_active=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0004_seed_demonstracao_completa'),
    ]

    operations = [
        migrations.RunPython(padronizar_senhas, migrations.RunPython.noop),
    ]
