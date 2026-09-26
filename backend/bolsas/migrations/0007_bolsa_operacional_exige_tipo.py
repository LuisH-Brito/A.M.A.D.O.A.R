from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bolsas', '0006_alter_bolsa_enfermeiro_coleta'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='bolsa',
            constraint=models.CheckConstraint(
                condition=(
                    ~models.Q(status__in=[2, 4])
                    | models.Q(tipo_sanguineo__isnull=False)
                ),
                name='bolsa_operacional_exige_tipo_sanguineo',
            ),
        ),
    ]
