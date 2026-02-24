from django.contrib import admin
from .models import Dados_Clinicos, MedicoDados, EnfermeiroDados

class MedicoDadosInline(admin.TabularInline):
    model = MedicoDados
    extra = 1 
    fields = ('medico', 'papel')

class EnfermeiroDadosInline(admin.TabularInline):
    model = EnfermeiroDados
    extra = 1
    fields = ('enfermeiro', 'papel')

@admin.register(Dados_Clinicos)
class DadosClinicosAdmin(admin.ModelAdmin):
    list_display = ('id', 'processo', 'peso', 'pressao_arterial', 'status_clinico')
    list_filter = ('status_clinico',)
    search_fields = ('processo__doador__nome_completo', 'processo__doador__cpf')
    inlines = [EnfermeiroDadosInline, MedicoDadosInline]
    fieldsets = (('Vínculo Sistêmico', {
                    'fields': ('processo',)}),
                ('Sinais Vitais e Biometria', {
                    'fields': ('peso', 'altura', 'pressao_arterial', 'hemoglobina')}),
                ('Laudo e Aprovação', {
                    'fields': ('status_clinico',)}),
    )