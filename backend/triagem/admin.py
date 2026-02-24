from django.contrib import admin
from .models import Questionario, Pergunta, Resposta

@admin.register(Pergunta)
class PerguntaAdmin(admin.ModelAdmin):
    list_display = ('id', 'texto', 'ativa')
    list_editable = ('ativa',) 
    search_fields = ('texto',)

class RespostaInline(admin.TabularInline):
    model = Resposta
    extra = 0  
    autocomplete_fields = ['pergunta'] 

@admin.register(Questionario)
class QuestionarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'doador', 'validade', 'data_hora_submissao')
    list_filter = ('validade', 'data_hora_submissao')
    search_fields = ('doador__nome_completo', 'doador__cpf')
    readonly_fields = ('data_hora_submissao',)
    # Conecta as perguntas aqui
    inlines = [RespostaInline] 
    
    fieldsets = (
        ('Vínculo do Doador', {'fields': ('doador',)}),
        ('Auditoria e Status', {'fields': ('validade', 'data_hora_submissao')}),
    )