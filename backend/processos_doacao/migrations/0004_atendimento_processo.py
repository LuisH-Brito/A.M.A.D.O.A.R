from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('processos_doacao', '0003_auto_processos'),
        ('usuarios', '0004_alter_usuario_email'),
    ]

    operations = [
        migrations.AddField(
            model_name='processo_doacao', name='atendimento_atualizado_em',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='processo_doacao', name='atendimento_usuario',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='processos_em_atendimento', to='usuarios.usuario',
            ),
        ),
    ]
