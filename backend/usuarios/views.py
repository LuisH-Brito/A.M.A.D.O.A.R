from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer, RevocableTokenRefreshSerializer
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from doadores.serializers import senha_forte
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Usuario
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import random, re
import logging
from smtplib import SMTPException

logger = logging.getLogger(__name__)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RevocableTokenRefreshView(TokenRefreshView):
    serializer_class = RevocableTokenRefreshSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_atual(request):
    return Response({'deve_alterar_senha': request.user.deve_alterar_senha})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trocar_senha_obrigatoria(request):
    usuario = request.user
    if not usuario.deve_alterar_senha:
        return Response({'erro': 'Troca obrigatória não pendente.'}, status=400)
    senha_atual = request.data.get('senha_atual') or ''
    nova_senha = request.data.get('nova_senha') or ''
    confirmar = request.data.get('confirmar_nova_senha') or ''
    if not usuario.check_password(senha_atual):
        return Response({'senha_atual': ['Senha atual incorreta.']}, status=400)
    if not nova_senha or nova_senha != confirmar:
        return Response({'nova_senha': ['Preencha senhas novas iguais.']}, status=400)
    if nova_senha == senha_atual or not senha_forte(nova_senha):
        return Response({'nova_senha': ['Use uma senha nova com 8 caracteres, maiúscula, minúscula e número.']}, status=400)
    try:
        validate_password(nova_senha, usuario)
    except DjangoValidationError as error:
        return Response({'nova_senha': error.messages}, status=400)
    usuario.set_password(nova_senha)
    usuario.deve_alterar_senha = False
    usuario.save(update_fields=['password', 'deve_alterar_senha'])
    return Response({'mensagem': 'Senha alterada com sucesso. Entre novamente com sua nova senha.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def search_email_by_cpf(request):
    cpf = request.query_params.get('cpf', '')

    try:
        email = Usuario.objects.search_email_by_cpf(cpf)
    except ValueError as exc:
        return Response({'erro': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if not email:
        return Response(
            {'erro': 'Usuário não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({'email': email}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_code_password_reset(request):
    cpf = request.data.get('cpf', '')
    cpf_sem_mascara = ''.join(ch for ch in (cpf or '') if ch.isdigit())

    mensagem_padrao = 'Se os dados informados estiverem corretos, você receberá um código por e-mail.'

    if len(cpf_sem_mascara) != 11:
        return Response({'mensagem': mensagem_padrao}, status=status.HTTP_200_OK)

    email = None
    try:
        email = Usuario.objects.search_email_by_cpf(cpf_sem_mascara)
    except ValueError:
        email = None

    if email:
        codigo = f'{random.randint(0, 999999):06d}'
        cache_key = f'password_reset_code:{cpf_sem_mascara}'
        cache.set(cache_key, codigo, timeout=90)

        try:
            send_mail(
                subject='Código de recuperação de senha',
                message=f'Seu código de recuperação é: {codigo}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except SMTPException:
            cache.delete(cache_key)
            logger.exception('Falha SMTP ao enviar código de recuperação.')
        except Exception:
            cache.delete(cache_key)
            logger.exception('Falha inesperada ao enviar código de recuperação.')

    return Response({'mensagem': mensagem_padrao}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_password_reset(request):
    cpf = request.data.get('cpf', '')
    codigo = (request.data.get('codigo', '') or '').strip()
    nova_senha = (request.data.get('nova_senha', '') or '').strip()

    cpf_sem_mascara = ''.join(ch for ch in (cpf or '') if ch.isdigit())

    if len(cpf_sem_mascara) != 11:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    if not codigo:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(nova_senha) < 8 or not re.search(r'[a-z]', nova_senha) or not re.search(r'[A-Z]', nova_senha) or not re.search(r'\d', nova_senha):
        return Response(
            {'erro': 'A senha deve conter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    codigo_salvo = cache.get(f'password_reset_code:{cpf_sem_mascara}')
    if not codigo_salvo or codigo != codigo_salvo:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = Usuario.objects.filter(cpf=cpf_sem_mascara).first()
    if not usuario:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario.set_password(nova_senha)
    usuario.deve_alterar_senha = False
    usuario.save(update_fields=['password', 'deve_alterar_senha'])
    cache.delete(f'password_reset_code:{cpf_sem_mascara}')

    return Response({'mensagem': 'Senha redefinida com sucesso.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_password_reset_code(request):
    cpf = request.data.get('cpf', '')
    codigo = (request.data.get('codigo', '') or '').strip()

    cpf_sem_mascara = ''.join(ch for ch in (cpf or '') if ch.isdigit())

    if len(cpf_sem_mascara) != 11 or not codigo:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    codigo_salvo = cache.get(f'password_reset_code:{cpf_sem_mascara}')
    if not codigo_salvo or codigo != codigo_salvo:
        return Response({'erro': 'Código inválido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'mensagem': 'Código válido.'}, status=status.HTTP_200_OK)
