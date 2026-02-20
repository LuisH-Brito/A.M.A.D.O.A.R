from django.db import models
from choices import Papel, StatusClinico 

class Dados_Clinicos(models.Model):
    # OneToOneField garante o UNIQUE do seu SQL original
    processo = models.OneToOneField('processos_doacao.Processo_Doacao', on_delete=models.CASCADE, related_name='dados_clinicos')
    peso = models.FloatField()
    altura = models.FloatField()
    hemoglobina = models.FloatField(null=True, blank=True)
    pressao_arterial = models.CharField(max_length=10, null=True, blank=True)
    status_clinico = models.PositiveSmallIntegerField(choices=StatusClinico.choices, default=StatusClinico.INAPTO)

    def __str__(self):
        return f"Dados Clínicos do Processo {self.processo.id}"
    

class MedicoDados(models.Model):
    medico = models.ForeignKey('medicos.Medico', on_delete=models.CASCADE, related_name='atendimentos_medicos')
    dados = models.ForeignKey('dados_clinicos.Dados_Clinicos', on_delete=models.CASCADE, related_name='medicos_envolvidos')
    papel = models.CharField(max_length=20, choices=Papel.choices)
    def __str__(self):
        return f"{self.medico.nome_completo} - {self.get_papel_display()}"

class EnfermeiroDados(models.Model):
    enfermeiro = models.ForeignKey('enfermeiros.Enfermeiro', on_delete=models.CASCADE, related_name='atendimentos_enfermeiros')
    dados = models.ForeignKey('dados_clinicos.Dados_Clinicos', on_delete=models.CASCADE, related_name='enfermeiros_envolvidos')
    papel = models.CharField(max_length=20, choices=Papel.choices)

    def __str__(self):
        return f"{self.enfermeiro.nome_completo} - {self.get_papel_display()}"
