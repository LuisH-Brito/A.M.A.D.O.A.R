from django.contrib import admin
from .models import Bolsa

@admin.register(Bolsa)
class BolsaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo_sanguineo', 'status', 'data_vencimento', 'doador')
    list_filter = ('status', 'tipo_sanguineo', 'data_vencimento')
    search_fields = ('id', 'doador__cpf', 'doador__nome_completo', 'enfermeiro_coleta__nome_completo')
    fieldsets = (('Rastreabilidade da Coleta', {
                    'fields': ('processo', 'doador', 'tipo_sanguineo')}),
                ('Controle de Qualidade (Laboratório)', {
                    'fields': ('status', 'data_vencimento', 'arquivo_laudo', 'validacao_at')}),
                ('Responsabilidade Técnica', {'fields': ('enfermeiro_coleta', 'medico_validacao')}),
        )