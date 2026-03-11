import datetime 
from django.utils import timezone
from choices import Papel, StatusBolsa
from django.db import models
from choices import StatusBolsa
from django.db.models.signals import post_delete
from django.dispatch import receiver
import os

class Bolsa(models.Model):
    processo = models.ForeignKey('processos_doacao.Processo_Doacao', on_delete=models.CASCADE, related_name='bolsas')
    doador = models.ForeignKey('doadores.Doador', on_delete=models.CASCADE, related_name='bolsas_doadas')
    tipo_sanguineo = models.ForeignKey('core.Tipo_Sanguineo', on_delete=models.PROTECT, null=True, blank=True)
    
    enfermeiro_coleta = models.ForeignKey('enfermeiros.Enfermeiro', on_delete=models.PROTECT,null=True, blank=True, related_name='bolsas_coletadas')
    medico_validacao = models.ForeignKey('medicos.Medico', on_delete=models.SET_NULL, null=True, blank=True, related_name='bolsas_validadas')

    status = models.PositiveSmallIntegerField(choices=StatusBolsa.choices, default=StatusBolsa.AGUARDANDO)
    data_vencimento = models.DateField(null=True, blank=True)
    validacao_at = models.DateTimeField(null=True, blank=True)
    arquivo_laudo = models.FileField(upload_to='laudos_bolsas/%Y/%m/%d/', null=True, blank=True)

    def __str__(self):
        return f"Bolsa {self.id} | Status: {self.get_status_display()}"
    
    def save(self, *args, **kwargs):  
            
        if not self.enfermeiro_coleta_id and self.processo_id:
            if hasattr(self.processo, 'dados_clinicos'):
                dados = self.processo.dados_clinicos
                enfermeiro_relacao = dados.enfermeiros_envolvidos.filter(papel=Papel.RESPONSAVEL_COLETA).first() 
                if enfermeiro_relacao:
                    self.enfermeiro_coleta = enfermeiro_relacao.enfermeiro

        if self.status == StatusBolsa.VALIDADO and not self.data_vencimento:
            if self.processo and self.processo.data_inicio:
                data_coleta = self.processo.data_inicio.date()
                self.data_vencimento = data_coleta + datetime.timedelta(days=35)
                    
        if self.status in [StatusBolsa.VALIDADO, StatusBolsa.INAPTO] and not self.validacao_at:
            self.validacao_at = timezone.now()     
        super().save(*args, **kwargs)


@receiver(post_delete, sender=Bolsa)
def deletar_laudo_bolsa(sender, instance, **kwargs):
    if instance.arquivo_laudo:
        caminho_arquivo = instance.arquivo_laudo.path
        if os.path.isfile(caminho_arquivo):
            os.remove(caminho_arquivo)
