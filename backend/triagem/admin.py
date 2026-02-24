from django.contrib import admin
from .models import Questionario, Pergunta

# Define como as perguntas aparecerão dentro do questionário
class PerguntaInline(admin.TabularInline):
    model = Pergunta
    extra = 0  
    fields = ('texto_pergunta', 'resposta_texto')

@admin.register(Questionario)
class QuestionarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'doador', 'validade', 'data_hora_submissao')
    list_filter = ('validade', 'data_hora_submissao')
    search_fields = ('doador__nome_completo', 'doador__cpf')
    readonly_fields = ('data_hora_submissao',)
    # Conecta as perguntas aqui
    inlines = [PerguntaInline]
    fieldsets = (('Vínculo do Doador', {'fields': ('doador',)}),
                 ('Auditoria e Status', {'fields': ('validade', 'data_hora_submissao')}),)
    
@admin.register(Pergunta)
class PerguntaAdmin(admin.ModelAdmin):
    list_display = ('id', 'questionario', 'resumo_pergunta', 'resposta_texto')
    search_fields = ('texto_pergunta', 'resposta_texto', 'questionario__doador__nome_completo')
    # Corta o texto se a pergunta for muito longa para não quebrar a tabela
    def resumo_pergunta(self, obj):
        return obj.texto_pergunta[:50] + "..." if len(obj.texto_pergunta) > 50 else obj.texto_pergunta
    resumo_pergunta.short_description = 'Pergunta'