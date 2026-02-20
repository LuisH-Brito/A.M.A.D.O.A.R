from django.db import models
from choices import StatusBolsa

class Bolsa(models.Model):
    processo = models.ForeignKey('processos_doacao.Processo_Doacao', on_delete=models.CASCADE, related_name='bolsas')
    doador = models.ForeignKey('doadores.Doador', on_delete=models.CASCADE, related_name='bolsas_doadas')
    tipo_sanguineo = models.ForeignKey('core.Tipo_Sanguineo', on_delete=models.PROTECT)
    
    enfermeiro_coleta = models.ForeignKey('enfermeiros.Enfermeiro', on_delete=models.PROTECT, related_name='bolsas_coletadas')
    medico_validacao = models.ForeignKey('medicos.Medico', on_delete=models.SET_NULL, null=True, blank=True, related_name='bolsas_validadas')

    status = models.PositiveSmallIntegerField(choices=StatusBolsa.choices, default=StatusBolsa.AGUARDANDO)
    data_vencimento = models.DateField()
    validacao_at = models.DateTimeField(null=True, blank=True)
    arquivo_laudo = models.FileField(upload_to='laudos_bolsas/%Y/%m/%d/', null=True, blank=True)

    def __str__(self):
        return f"Bolsa {self.id} | Status: {self.get_status_display()}"
