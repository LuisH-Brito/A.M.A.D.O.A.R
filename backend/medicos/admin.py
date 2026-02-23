from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Medico

class MedicoForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Medico
        fields = ('username', 'cpf', 'nome_completo', 'crm')

@admin.register(Medico)
class MedicoAdmin(UserAdmin):
    add_form = MedicoForm
    list_display = ('id', 'nome_completo', 'cpf', 'crm', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'crm')

    fieldsets = UserAdmin.fieldsets + (
        ('Dados Pessoais', {'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')}),
        ('Credenciais Médicas', {'fields': ('crm',)}),
    )

    add_fieldsets = (
        ('Dados Obrigatórios e Profissionais', {
            'classes': ('wide',),
            'fields': ('username', 'cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco', 'crm', 'password1', 'password2'),
        }),
    )