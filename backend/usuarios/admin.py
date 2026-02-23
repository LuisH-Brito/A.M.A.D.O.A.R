from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Usuario

class UsuarioForm(UserCreationForm):
    class Meta(UserCreationForm.Meta): 
        model = Usuario
        fields = ('username', 'cpf', 'nome_completo')

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    add_form = UsuarioForm

    list_display = ('id', 'nome_completo', 'cpf', 'email', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'email')
    

    fieldsets = UserAdmin.fieldsets + (
        ('Dados do A.M.A.D.O.A.R', {'fields': ('cpf', 'nome_completo', 'endereco', 'data_nascimento')}),
    )

    add_fieldsets = (
        ('Dados Obrigatórios', {
            'classes': ('wide',),
            'fields': ('username', 'cpf', 'nome_completo','email','data_nascimento','endereco', 'password1', 'password2'), 
        }),
    )