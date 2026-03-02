from rest_framework.routers import DefaultRouter
from .views import RecepcionistaViewSet

router = DefaultRouter()
router.register(r'', RecepcionistaViewSet)

urlpatterns = router.urls