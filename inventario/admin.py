from django.contrib import admin
from django import forms
from django.db.models import Sum
from .models import Operario, Producto, Movimiento

class ProductoAdminForm(forms.ModelForm):
    ajuste_stock_actual = forms.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        required=False,
        help_text="Escribe el stock real para generar un ajuste automático."
    )

    class Meta:
        model = Producto
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            entradas = self.instance.movimiento_set.filter(tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
            salidas = self.instance.movimiento_set.filter(tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
            stock_actual = round(entradas - salidas, 3)
            self.fields['ajuste_stock_actual'].initial = int(stock_actual) if stock_actual == int(stock_actual) else stock_actual

class StockActualFilter(admin.SimpleListFilter):
    title = 'estado del stock'
    parameter_name = 'stock'

    def lookups(self, request, model_admin):
        return (
            ('con_stock', 'Con Stock (> 0)'),
            ('sin_stock', 'Sin Stock (0)'),
        )

    def queryset(self, request, queryset):
        if self.value():
            from django.db.models import Sum, Q, F
            from django.db.models.functions import Coalesce
            from decimal import Decimal
            
            qs = queryset.annotate(
                total_entradas=Coalesce(Sum('movimiento__cantidad', filter=Q(movimiento__tipo_movimiento='ENTRADA')), Decimal('0')),
                total_salidas=Coalesce(Sum('movimiento__cantidad', filter=Q(movimiento__tipo_movimiento__in=['SALIDA', 'MERMA'])), Decimal('0')),
                stock_calculado=F('total_entradas') - F('total_salidas')
            )
            
            if self.value() == 'con_stock':
                return qs.filter(stock_calculado__gt=0)
            if self.value() == 'sin_stock':
                return qs.filter(stock_calculado__lte=0)
        return queryset

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    form = ProductoAdminForm
    list_display = ('codigo', 'descripcion', 'categoria', 'unidad_medida', 'get_stock_actual')
    search_fields = ('codigo', 'descripcion')
    list_filter = ('categoria', StockActualFilter)
    actions = ['export_stock_to_csv']

    def get_stock_actual(self, obj):
        from django.db.models import Sum
        entradas = obj.movimiento_set.filter(tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
        salidas = obj.movimiento_set.filter(tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
        stock = round(entradas - salidas, 3)
        return int(stock) if stock == int(stock) else stock
    get_stock_actual.short_description = 'Stock Actual'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        ajuste = form.cleaned_data.get('ajuste_stock_actual')
        if ajuste is not None:
            stock_actual_real = 0
            if change:
                entradas = obj.movimiento_set.filter(tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
                salidas = obj.movimiento_set.filter(tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
                stock_actual_real = round(entradas - salidas, 3)
            
            diferencia = round(ajuste - stock_actual_real, 3)
            if diferencia != 0:
                admin_operario, _ = Operario.objects.get_or_create(
                    nombre='ADMIN_SISTEMA',
                    defaults={'activo': True, 'password': 'admin'}
                )
                if diferencia > 0:
                    Movimiento.objects.create(
                        producto=obj,
                        operario=admin_operario,
                        tipo_movimiento='ENTRADA',
                        cantidad=diferencia
                    )
                elif diferencia < 0:
                    Movimiento.objects.create(
                        producto=obj,
                        operario=admin_operario,
                        tipo_movimiento='MERMA',
                        cantidad=abs(diferencia)
                    )

    @admin.action(description='Exportar stock actual a CSV')
    def export_stock_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse
        from django.db.models import Sum
        
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="stock_actual_productos.csv"'
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow(['Código', 'Producto', 'Categoría', 'Unidad de Medida', 'Stock Actual'])
        
        for prod in queryset:
            entradas = prod.movimiento_set.filter(tipo_movimiento='ENTRADA').aggregate(total=Sum('cantidad'))['total'] or 0
            salidas = prod.movimiento_set.filter(tipo_movimiento__in=['SALIDA', 'MERMA']).aggregate(total=Sum('cantidad'))['total'] or 0
            stock_actual = round(entradas - salidas, 3)
            stock_actual_fmt = int(stock_actual) if stock_actual == int(stock_actual) else stock_actual
            
            writer.writerow([
                prod.codigo,
                prod.descripcion,
                prod.categoria,
                prod.unidad_medida,
                stock_actual_fmt
            ])
            
        return response

import csv
from django.http import HttpResponse

@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ('fecha_hora', 'tipo_movimiento', 'producto', 'cantidad', 'operario', 'observaciones')
    list_filter = ('tipo_movimiento', 'fecha_hora', 'operario')
    search_fields = ('producto__descripcion',)
    actions = ['export_to_csv']

    @admin.action(description='Exportar movimientos seleccionados a CSV')
    def export_to_csv(self, request, queryset):
        # Usamos utf-8-sig para que Excel reconozca los acentos y delimitador ';' para separar en columnas
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="movimientos_export.csv"'
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow(['ID', 'Fecha', 'Hora', 'Tipo', 'Producto', 'Unidad de Medida', 'Cantidad', 'Operario', 'Observaciones'])
        
        from django.utils.timezone import localtime
        for mov in queryset:
            fecha_local = localtime(mov.fecha_hora)
            fecha = fecha_local.strftime('%Y-%m-%d')
            hora = fecha_local.strftime('%H:%M:%S')
            
            cantidad_fmt = int(mov.cantidad) if mov.cantidad == int(mov.cantidad) else mov.cantidad
            
            writer.writerow([
                mov.id,
                fecha,
                hora,
                mov.tipo_movimiento,
                mov.producto.descripcion,
                mov.producto.unidad_medida,
                cantidad_fmt,
                mov.operario.nombre,
                mov.observaciones or ''
            ])
            
        return response

# El registro más simple para los operarios
admin.site.register(Operario)