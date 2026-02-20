from django.db import models

class StatusProcesso(models.IntegerChoices):
    RECEPCAO = 1, 'Recepção'
    TRIAGEM = 2, 'Triagem'
    COLETA = 3, 'Coleta'
    CONCLUIDO = 4, 'Concluído'
    CANCELADO = 0, 'Cancelado'

class StatusClinico(models.IntegerChoices):
    INAPTO = 0, 'Inapto'
    APTO = 1, 'Apto'

class StatusBolsa(models.IntegerChoices):
    AGUARDANDO = 1, 'Aguardando Validação'
    VALIDADO = 2, 'Validado'
    INAPTO = 3, 'Inapto'
    UTILIZADO = 4, 'Utilizado'

class TipoSanguineo(models.TextChoices):
    A = 'A', 'Tipo A'
    B = 'B', 'Tipo B'
    AB = 'AB', 'Tipo AB'
    O = 'O', 'Tipo O'

class FatorRH(models.TextChoices):
    POSITIVO = '+', 'Positivo (+)'
    NEGATIVO = '-', 'Negativo (-)'

class Sexo(models.TextChoices):
    MASCULINO = 'M', 'Masculino'
    FEMININO = 'F', 'Feminino'

class Papel(models.TextChoices):
    RESPONSAVEL_PRE_TRIAGEM = 'PRE_TRIAGEM', 'Responsável pela Pré-Triagem'
    RESPONSAVEL_TRIAGEM = 'TRIAGEM', 'Responsável pela Triagem'
    RESPONSAVEL_COLETA = 'COLETA', 'Responsável pela Coleta'
