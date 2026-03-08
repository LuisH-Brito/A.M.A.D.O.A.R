from django.apps import AppConfig


class BolsasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bolsas'

    def ready(self):
        # Esta linha é OBRIGATÓRIA para o Signal funcionar so nao sei pq
        import bolsas.signals
