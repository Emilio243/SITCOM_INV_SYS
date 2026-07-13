from django.db import models

class Operario(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=50, default='1234')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    CATEGORIAS = [
        ('BARRA', 'Barra'),
        ('COCINA', 'Cocina'),
        ('EMPAQUES', 'Empaques'),
        ('INSUMOS', 'Insumos'),
    ]
    UNIDADES = [
        ('UND', 'Unidades'),
        ('KG', 'Kilogramos'),
        ('LTS', 'Litros'),
    ]

    codigo = models.IntegerField(unique=True)
    descripcion = models.CharField(max_length=200)
    unidad_medida = models.CharField(max_length=10, choices=UNIDADES)
    categoria = models.CharField(max_length=50, choices=CATEGORIAS)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=0.000)

    def __str__(self):
        return f"{self.codigo} - {self.descripcion}"

from django.core.validators import MinValueValidator

class Movimiento(models.Model):
    TIPOS = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('MERMA', 'Merma'),
    ]

    fecha_hora = models.DateTimeField(auto_now_add=True)
    producto = models.ForeignKey(Producto, on_delete=models.RESTRICT)
    operario = models.ForeignKey(Operario, on_delete=models.RESTRICT)
    tipo_movimiento = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.DecimalField(
        max_digits=10, 
        decimal_places=3,
        validators=[MinValueValidator(0.001)]
    )
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_movimiento} | {self.producto.descripcion} | {self.cantidad}"