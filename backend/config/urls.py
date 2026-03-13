from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from django.conf import settings
from django.conf.urls.static import static
from usuarios.views import (
    MyTokenObtainPairView,
    search_email_by_cpf,
    request_code_password_reset,
    confirm_password_reset,
    validate_password_reset_code,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('doadores.urls')),
    path('api/', include('triagem.urls')),
    path('api/', include('processos_doacao.urls')),
    path('api/', include('bolsas.urls')),
    path('api/', include('core.urls')),
    path('api/', include('exames_doador.urls')),
    path('api/', include('dados_clinicos.urls')),
    path('api/medicos/', include('medicos.urls')),
    path('api/enfermeiros/', include('enfermeiros.urls')),
    path('api/recepcionistas/', include('recepcionistas.urls')),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/usuarios/search-email-by-cpf/', search_email_by_cpf, name='search_email_by_cpf'),
    path('api/usuarios/request-code-password-reset/', request_code_password_reset, name='request_code_password_reset'),
    path('api/usuarios/confirm-password-reset/', confirm_password_reset, name='confirm_password_reset'),
    path('api/usuarios/validate-password-reset-code/', validate_password_reset_code, name='validate_password_reset_code'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)