from django.db import models
from choices import StatusProcesso 

class Processo_Doacao(models.Model):
    questionario = models.OneToOneField('triagem.Questionario', on_delete=models.CASCADE, null=True, blank=True, related_name='processo')
    doador = models.ForeignKey('doadores.Doador', on_delete=models.CASCADE, related_name='processos')
    recepcionista = models.ForeignKey('recepcionistas.Recepcionista', on_delete=models.CASCADE, related_name='atendimentos')
    status = models.PositiveSmallIntegerField(choices=StatusProcesso.choices, default=StatusProcesso.RECEPCAO)
    data_inicio = models.DateTimeField(auto_now_add=True)
    atendimento_usuario = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='processos_em_atendimento',
    )
    atendimento_atualizado_em = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Processo {self.id} - Doador ID: {self.doador.id}"