from rest_framework.routers import DefaultRouter
from .views import AdministradorViewSet

router = DefaultRouter()
router.register(r'', AdministradorViewSet)

urlpatterns = router.urls
