from django.db import migrations

def inserir_tipos_sanguineos(apps, schema_editor):
    Tipo_Sanguineo = apps.get_model('core', 'Tipo_Sanguineo')
    
    tipos = ['A', 'B', 'AB', 'O']
    fatores_rh = ['+', '-']

    for tipo in tipos:
        for fator in fatores_rh:
            Tipo_Sanguineo.objects.get_or_create(
                tipo=tipo,
                fator_rh=fator
            )

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'), 
    ]
    operations = [
        migrations.RunPython(
            inserir_tipos_sanguineos
        ),
    ]