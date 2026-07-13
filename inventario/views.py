from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Operario, Producto, Movimiento
from .serializers import OperarioSerializer, ProductoSerializer, MovimientoSerializer

class OperarioViewSet(viewsets.ModelViewSet):
    queryset = Operario.objects.all()
    serializer_class = OperarioSerializer

    @action(detail=True, methods=['post'])
    def login(self, request, pk=None):
        operario = self.get_object()
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Contraseña requerida'}, status=400)
        
        if operario.password == password:
            return Response({'status': 'ok', 'operario': OperarioSerializer(operario).data})
        else:
            return Response({'error': 'Contraseña incorrecta'}, status=401)

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.all().order_by('-fecha_hora')
    serializer_class = MovimientoSerializer
