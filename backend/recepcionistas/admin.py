from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Recepcionista

class RecepcionistaForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Recepcionista
        fields = ('username', 'cpf', 'nome_completo')

@admin.register(Recepcionista)
class RecepcionistaAdmin(UserAdmin):
    add_form = RecepcionistaForm
    list_display = ('id', 'nome_completo', 'cpf', 'email', 'is_staff')
    search_fields = ('cpf', 'nome_completo')

    fieldsets = UserAdmin.fieldsets + (
        ('Dados Pessoais', {'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')}),
    )

    add_fieldsets = (
        ('Dados Obrigatórios', {
            'classes': ('wide',),
            'fields': ('username', 'cpf', 'nome_completo', 'email', 'data_nascimento', 'endereco', 'password1', 'password2'),
        }),
    )