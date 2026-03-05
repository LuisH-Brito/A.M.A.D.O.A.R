from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from usuarios.views import MyTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('doadores.urls')),
    path('api/', include('triagem.urls')),
    path('api/', include('processos_doacao.urls')),
    path('api/', include('bolsas.urls')),
    path('api/medicos/', include('medicos.urls')),
    path('api/enfermeiros/', include('enfermeiros.urls')),
    path('api/recepcionistas/', include('recepcionistas.urls')),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
