from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Doador

class DoadorForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Doador
        fields = ('username', 'cpf', 'nome_completo')

@admin.register(Doador)
class DoadorAdmin(UserAdmin):
    add_form = DoadorForm

    list_display = ('id', 'nome_completo', 'cpf', 'sexo', 'tipo_sanguineo_declarado', 'fator_rh')
    search_fields = ('cpf', 'nome_completo', 'email')
    list_filter = ('sexo', 'tipo_sanguineo_declarado', 'fator_rh')

    # Tela de edição
    fieldsets = UserAdmin.fieldsets + (
        ('Dados Pessoais', {
            'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')
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
                'username', 'cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco',
                'sexo', 'tipo_sanguineo_declarado', 'fator_rh', 
                'password1', 'password2'
            ),
        }),
    )