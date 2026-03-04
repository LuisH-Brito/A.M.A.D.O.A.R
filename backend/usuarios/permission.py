from rest_framework import permissions

class EhEnfermeiro(permissions.BasePermission):
    """
    Permite acesso apenas se o usuário logado for um Enfermeiro.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return hasattr(request.user, 'enfermeiro')

class EhMedico(permissions.BasePermission):
    """
    Permite acesso apenas se o usuário logado for um Médico.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return hasattr(request.user, 'medico')
    
class EhRecepcionista(permissions.BasePermission):
    """
    Permite acesso apenas se o usuário logado for um Recepcionista.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return hasattr(request.user, 'recepcionista')
    
class EhUsuarioComum(permissions.BasePermission):

    """
    Permite acesso apenas se o usuário logado for um usuário comum (sem perfil específico).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return not (hasattr(request.user, 'enfermeiro') or 
                    hasattr(request.user, 'medico') or 
                    hasattr(request.user, 'recepcionista'))
    
class EhAdministrador(permissions.BasePermission):
    """
    Permissão de alto nível para Administradores do sistema.
    
    Garante acesso se o usuário for um 'superuser' do Django 
    OU se possuir o perfil específico de 'administrador'.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or hasattr(request.user, 'administrador'))
        )
    

class EhDoador(permissions.BasePermission):
    """
    Permissão específica para Doadores.
    
    Permite que o usuário acesse apenas recursos destinados ao doador, 
    como seu próprio histórico ou agendamentos.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return hasattr(request.user, 'doador')
    


class EhSuperAdmin(permissions.BasePermission):
    """
    Permissão máxima do sistema.
    
    Restrita apenas a usuários com a flag 'is_superuser' marcada no banco.
    Geralmente usada para configurações críticas do sistema.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)