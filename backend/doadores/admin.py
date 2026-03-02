from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Doador

class DoadorForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Doador
        fields = ('cpf', 'nome_completo')

@admin.register(Doador)
class DoadorAdmin(UserAdmin):
    add_form = DoadorForm

    list_display = ('id', 'nome_completo', 'cpf', 'sexo', 'tipo_sanguineo_declarado', 'fator_rh')
    search_fields = ('cpf', 'nome_completo', 'email','telefone')
    list_filter = ('sexo', 'tipo_sanguineo_declarado', 'fator_rh')
    ordering = ('cpf',)
    # Tela de edição
    fieldsets = UserAdmin.fieldsets + (
        ('Dados Pessoais', {
            'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento', 'telefone')
        }),
        ('Dados Clínicos e Documentos', {
            'fields': ('sexo', 'tipo_sanguineo_declarado', 'fator_rh', 'carteira_doador')
        }),
    )

    # Tela de criação
    add_fieldsets = (
        ('Dados Obrigatórios e Clínicos', {
            'classes': ('wide',),
            'fields': (
                'cpf', 'nome_completo', 'email', 'telefone', 'data_nascimento', 'endereco',
                'sexo', 'tipo_sanguineo_declarado', 'fator_rh', 
                'password1', 'password2'
            ),
        }),
    )