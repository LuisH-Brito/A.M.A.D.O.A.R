from django.contrib import admin
from .models import Tipo_Sanguineo

@admin.register(Tipo_Sanguineo)
class TipoSanguineoAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo', 'fator_rh')
    search_fields = ('tipo',)
    list_filter = ('fator_rh',)

    # Retornar False nestas funções impede que usuários deletem os tipos sanguíneos base
    def has_delete_permission(self, request, obj=None):
        return False