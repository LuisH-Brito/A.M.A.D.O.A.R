from rest_framework.routers import DefaultRouter
from .views import EnfermeiroViewSet

router = DefaultRouter()
router.register(r'', EnfermeiroViewSet)

urlpatterns = router.urls