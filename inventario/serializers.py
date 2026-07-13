from rest_framework import serializers
from django.db.models import Sum
from .models import Operario, Producto, Movimiento

class OperarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Operario
        fields = '__all__'

class ProductoSerializer(serializers.ModelSerializer):
    stock_actual = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_stock_actual(self, obj):
        entradas = Movimiento.objects.filter(producto=obj, tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
        salidas = Movimiento.objects.filter(producto=obj, tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
        stock = round(entradas - salidas, 3)
        return int(stock) if stock == int(stock) else stock

class MovimientoSerializer(serializers.ModelSerializer):
    operario_nombre = serializers.ReadOnlyField(source='operario.nombre')
    producto_descripcion = serializers.ReadOnlyField(source='producto.descripcion')
    producto_unidad = serializers.ReadOnlyField(source='producto.unidad_medida')

    class Meta:
        model = Movimiento
        fields = [
            'id', 'fecha_hora', 'producto', 'operario', 'tipo_movimiento', 'cantidad', 
            'observaciones', 'operario_nombre', 'producto_descripcion', 'producto_unidad'
        ]

    def validate(self, data):
        # Evitar stock negativo en base de datos
        if data['tipo_movimiento'] in ['SALIDA', 'MERMA']:
            producto = data['producto']
            entradas = Movimiento.objects.filter(producto=producto, tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
            salidas = Movimiento.objects.filter(producto=producto, tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
            stock_actual = entradas - salidas
            if data['cantidad'] > stock_actual:
                raise serializers.ValidationError("Stock insuficiente")
        return data
