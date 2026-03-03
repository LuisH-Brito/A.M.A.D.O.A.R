from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Enfermeiro

class EnfermeiroForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Enfermeiro
        fields = ('cpf', 'nome_completo', 'coren')

@admin.register(Enfermeiro)
class EnfermeiroAdmin(UserAdmin):
    add_form = EnfermeiroForm
    list_display = ('id', 'nome_completo', 'cpf', 'coren', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'coren')
    ordering = ('cpf',)
    fieldsets = (
        ('Credenciais de Acesso', {
            'fields': ('email', 'password')
        }),
        ('Dados Pessoais', {
            'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')
        }),
        ('Credenciais', {
            'fields': ('coren',)
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
            'fields': ('cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco', 'coren', 'password1', 'password2'),
        }),
    )