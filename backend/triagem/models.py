from datetime import timedelta

from django.db import models
from django.utils import timezone

class Pergunta(models.Model):
    texto = models.TextField()
    ativa = models.BooleanField(default=True) # Para poder "desligar" perguntas antigas no futuro
    resposta_esperada = models.CharField(max_length=3, choices=[('Sim', 'Sim'), ('Não', 'Não')], default='Sim') 
    motivo_inaptidao = models.CharField(max_length=255, default='Não especificado')

    def __str__(self):
        return self.texto[:50]

class Questionario(models.Model):
    JANELA_VALIDADE_ONLINE = timedelta(hours=24)

    doador = models.ForeignKey('doadores.Doador', on_delete=models.CASCADE, related_name='questionarios')
    validade = models.BooleanField(default=True)
    data_hora_submissao = models.DateTimeField(auto_now_add=True)

    @classmethod
    def limite_validade_online(cls, referencia=None):
        referencia = referencia or timezone.now()
        return referencia - cls.JANELA_VALIDADE_ONLINE

    @classmethod
    def elegiveis_para_processo(cls, doador, referencia=None):
        return cls.objects.filter(
            doador=doador,
            validade=True,
            processo__isnull=True,
            data_hora_submissao__gte=cls.limite_validade_online(referencia),
        )

    def __str__(self):
        # Tenta pegar o nome, se não der (ex: doador deletado), usa o ID
        nome = self.doador.nome_completo if self.doador else "Desconhecido"
        return f"Questionário {self.id} - {nome}"

class Resposta(models.Model):
    questionario = models.ForeignKey(Questionario, on_delete=models.CASCADE, related_name='respostas')
    pergunta = models.ForeignKey(Pergunta, on_delete=models.PROTECT) # PROTECT: não deixa apagar a pergunta se alguém já respondeu
    resposta_texto = models.TextField() # resposta so vai ser vazia antes de enviar o questionario

    def __str__(self):
        return f"{self.pergunta.texto[:20]}... -> {self.resposta_texto}"
