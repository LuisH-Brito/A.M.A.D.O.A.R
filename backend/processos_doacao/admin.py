from django.contrib import admin
from .models import Processo_Doacao

@admin.register(Processo_Doacao)
class ProcessoDoacaoAdmin(admin.ModelAdmin):
    list_display = ('id', 'doador', 'recepcionista', 'status', 'data_inicio')
    list_filter = ('status', 'data_inicio')
    search_fields = ('doador__nome_completo', 'doador__cpf', 'recepcionista__nome_completo')
    readonly_fields = ('data_inicio',)

    fieldsets = (('Atores Envolvidos', {
                    'fields': ('doador', 'recepcionista')}),
                ('Módulos Vinculados', {
                    'fields': ('questionario',)}),
                ('Controle de Fluxo', {
                    'fields': ('status', 'data_inicio')}),
    )