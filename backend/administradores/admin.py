from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Administrador

class AdministradorForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Administrador
        fields = ('username', 'cpf', 'nome_completo')

@admin.register(Administrador)
class AdministradorAdmin(UserAdmin):
    add_form = AdministradorForm
    list_display = ('id', 'nome_completo', 'cpf', 'email', 'is_staff', 'is_superuser')
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