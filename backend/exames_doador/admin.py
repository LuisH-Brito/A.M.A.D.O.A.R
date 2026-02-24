from django.contrib import admin
from .models import Exame_Doador

@admin.register(Exame_Doador)
class ExameDoadorAdmin(admin.ModelAdmin):
    list_display = ('id', 'doador', 'nome_arquivo', 'data_upload')
    list_filter = ('data_upload',)
    # Para pesquisar dentro de uma ForeignKey, usamos duplo underline
    search_fields = ('nome_arquivo', 'doador__nome_completo', 'doador__cpf')
    # Obriga o painel a exibir a data apenas como texto informativo
    readonly_fields = ('data_upload',)
    fieldsets = (
        ('Vínculo', { 'fields': ('doador',) }),
        ('Documento', { 'fields': ('nome_arquivo', 'arquivo', 'data_upload') }),
    )