from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Enfermeiro

class EnfermeiroForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Enfermeiro
        fields = ('username', 'cpf', 'nome_completo', 'coren')

@admin.register(Enfermeiro)
class EnfermeiroAdmin(UserAdmin):
    add_form = EnfermeiroForm
    list_display = ('id', 'nome_completo', 'cpf', 'coren', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'coren')

    fieldsets = UserAdmin.fieldsets + (
        ('Dados Pessoais', {'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')}),
        ('Credenciais de Enfermagem', {'fields': ('coren',)}),
    )

    add_fieldsets = (
        ('Dados Obrigatórios e Profissionais', {
            'classes': ('wide',),
            'fields': ('username', 'cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco', 'coren', 'password1', 'password2'),
        }),
    )