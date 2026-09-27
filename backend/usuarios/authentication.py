from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication


class TrocaSenhaJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        allowed = {
            '/api/usuarios/me/',
            '/api/usuarios/trocar-senha-obrigatoria/',
        }
        if user.deve_alterar_senha and request.path not in allowed:
            raise PermissionDenied('Altere sua senha antes de continuar.')
        return user, token
