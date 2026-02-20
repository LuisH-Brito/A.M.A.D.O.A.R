from django.db import models

class Exame_Doador(models.Model):
    doador = models.ForeignKey( 'doadores.Doador', on_delete=models.CASCADE, related_name='exames_doador' )
    # O FileField gerencia o arquivo físico e organiza em pastas por data (Ano/Mês/Dia)
    arquivo = models.FileField(upload_to='exames_doador/%Y/%m/%d/')
    nome_arquivo = models.CharField(max_length=100, null=True, blank=True)
    data_upload = models.DateTimeField(auto_now_add=True)     # Registra automaticamente a data e hora do upload 

    def __str__(self):
        return f"Exame: {self.nome_arquivo} - Doador: {self.doador.nome_completo}"