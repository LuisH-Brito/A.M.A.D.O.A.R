import datetime 
from django.core.exceptions import ValidationError
from django.utils import timezone
from choices import FatorRH, Papel, StatusBolsa, TipoSanguineo
from django.db import models
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

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    ~models.Q(status__in=[StatusBolsa.VALIDADO, StatusBolsa.UTILIZADO])
                    | models.Q(tipo_sanguineo__isnull=False)
                ),
                name='bolsa_operacional_exige_tipo_sanguineo',
            ),
        ]

    def __str__(self):
        return f"Bolsa {self.id} | Status: {self.get_status_display()}"

    def clean(self):
        super().clean()

        if self.status not in [StatusBolsa.VALIDADO, StatusBolsa.UTILIZADO]:
            return

        if not self.tipo_sanguineo_id:
            raise ValidationError({
                'tipo_sanguineo': (
                    'Bolsas validadas ou utilizadas devem possuir tipo sanguíneo.'
                ),
            })

        tipo_sanguineo = self.tipo_sanguineo
        if (
            tipo_sanguineo.tipo not in TipoSanguineo.values
            or tipo_sanguineo.fator_rh not in FatorRH.values
        ):
            raise ValidationError({
                'tipo_sanguineo': 'O tipo sanguíneo deve possuir ABO e fator Rh válidos.',
            })
    
    def save(self, *args, **kwargs):  
        self.full_clean()

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
