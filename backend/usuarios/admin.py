from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm
from .models import Usuario

class UsuarioForm(UserCreationForm):
    class Meta(UserCreationForm.Meta): 
        model = Usuario
        fields = ('cpf', 'nome_completo', 'email')

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    add_form = UsuarioForm

    list_display = ('id', 'nome_completo', 'cpf', 'email', 'is_staff')
    search_fields = ('cpf', 'nome_completo', 'email')
    ordering = ('cpf',)
    
    fieldsets = (
        (None, {'fields': ('cpf', 'password')}),
        ('Informações Pessoais', {'fields': ('nome_completo', 'email', 'endereco', 'data_nascimento')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        ('Dados Obrigatórios', {
            'classes': ('wide',),
            'fields': ('cpf', 'nome_completo','email','data_nascimento','endereco', 'password1', 'password2'), 
        }),
    )