from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('usuarios', '0004_alter_usuario_email')]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='deve_alterar_senha',
            field=models.BooleanField(default=False),
        ),
    ]
