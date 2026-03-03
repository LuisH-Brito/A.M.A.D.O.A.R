from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Medico

class MedicoForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Medico
        fields = ('cpf', 'nome_completo', 'crm')

@admin.register(Medico)
class MedicoAdmin(UserAdmin):
    add_form = MedicoForm
    list_display = ('id', 'nome_completo', 'cpf', 'crm', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'crm')
    ordering = ('cpf',)
    fieldsets = (
        ('Credenciais de Acesso', {
            'fields': ('email', 'password')
        }),
        ('Dados Pessoais', {
            'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')
        }),
        ('Credenciais', {
            'fields': ('crm',)
        }),
        ('Controle de Acesso ao Sistema', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Histórico de Acesso', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        ('Dados Obrigatórios e Profissionais', {
            'classes': ('wide',),
            'fields': ('cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco', 'crm', 'password1', 'password2'),
        }),
    )