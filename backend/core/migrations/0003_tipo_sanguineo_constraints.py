from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_auto_tipos_sanguineos'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='tipo_sanguineo',
            constraint=models.UniqueConstraint(
                fields=('tipo', 'fator_rh'),
                name='tipo_sanguineo_abo_rh_unico',
            ),
        ),
        migrations.AddConstraint(
            model_name='tipo_sanguineo',
            constraint=models.CheckConstraint(
                condition=models.Q(tipo__in=['A', 'B', 'AB', 'O']),
                name='tipo_sanguineo_abo_valido',
            ),
        ),
        migrations.AddConstraint(
            model_name='tipo_sanguineo',
            constraint=models.CheckConstraint(
                condition=models.Q(fator_rh__in=['+', '-']),
                name='tipo_sanguineo_rh_valido',
            ),
        ),
    ]
