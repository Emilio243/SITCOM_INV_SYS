from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OperarioViewSet, ProductoViewSet, MovimientoViewSet

router = DefaultRouter()
router.register(r'operarios', OperarioViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'movimientos', MovimientoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
