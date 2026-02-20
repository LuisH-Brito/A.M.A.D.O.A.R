from django.db import models

class Questionario(models.Model):
    doador = models.ForeignKey('doadores.Doador', on_delete=models.CASCADE, related_name='questionarios')
    validade = models.BooleanField(default=True)
    data_hora_submissao = models.DateTimeField(auto_now_add=True)  # Equivale ao DATETIME DEFAULT CURRENT_TIMESTAMP
    def __str__(self):
        return f"Questionário {self.id} - Doador: {self.doador.nome_completo}"

class Pergunta(models.Model):
    questionario = models.ForeignKey(Questionario, on_delete=models.CASCADE, related_name='perguntas')
    texto_pergunta = models.TextField() # TEXT no SQL vira TextField no Django
    resposta_texto = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Pergunta do Q-{self.questionario.id}: {self.texto_pergunta[:30]}..."
    

    