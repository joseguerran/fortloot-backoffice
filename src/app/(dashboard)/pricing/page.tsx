'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Percent, TrendingUp, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  // Fetch pricing config
  const { data: config, isLoading } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => pricingApi.getConfig(),
  });

  // Update form data when config loads
  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => pricingApi.updateConfig(data),
    onSuccess: () => {
      toast.success('Configuración actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Extract only the configuration fields, excluding metadata
    const configData = {
      vbucksToUsdRate: formData.vbucksToUsdRate,
      usdToLocalRate: formData.usdToLocalRate,
      defaultProfitMargin: formData.defaultProfitMargin,
      defaultDiscount: formData.defaultDiscount,
      taxRate: formData.taxRate,
      applyTaxToFinalPrice: formData.applyTaxToFinalPrice,
      categoryDiscounts: formData.categoryDiscounts,
      tierDiscounts: formData.tierDiscounts,
      currencyCode: formData.currencyCode,
      currencySymbol: formData.currencySymbol,
    };

    updateMutation.mutate(configData);
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData({ ...formData, [field]: numValue });
    }
  };

  return (
    <>
      <Header title="Configuración de Precios" />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tasas de Conversión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Tasas de Conversión
            </CardTitle>
            <CardDescription>
              Configura las tasas de conversión entre diferentes monedas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vbucksToUsdRate">V-Bucks a USD</Label>
                <Input
                  id="vbucksToUsdRate"
                  type="number"
                  step="0.00001"
                  value={formData.vbucksToUsdRate || 0.005}
                  onChange={(e) => handleNumberChange('vbucksToUsdRate', e.target.value)}
                  placeholder="0.005"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: 0.005 = 1 V-Buck = $0.005 USD
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usdToLocalRate">USD a Moneda Local</Label>
                <Input
                  id="usdToLocalRate"
                  type="number"
                  step="0.01"
                  value={formData.usdToLocalRate || 1.0}
                  onChange={(e) => handleNumberChange('usdToLocalRate', e.target.value)}
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: 20.5 para convertir USD a MXN
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Código de Moneda</Label>
                <Input
                  id="currencyCode"
                  value={formData.currencyCode || 'USD'}
                  onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                  placeholder="USD"
                />
                <p className="text-xs text-muted-foreground">
                  ISO 4217 (USD, MXN, COP, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Símbolo de Moneda</Label>
                <Input
                  id="currencySymbol"
                  value={formData.currencySymbol || '$'}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  placeholder="$"
                />
                <p className="text-xs text-muted-foreground">
                  Símbolo que se mostrará (ej: $, €, £)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Márgenes y Descuentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Márgenes y Descuentos por Defecto
            </CardTitle>
            <CardDescription>
              Configura los porcentajes que se aplicarán a los productos sin configuración específica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultProfitMargin">Margen de Ganancia (%)</Label>
                <Input
                  id="defaultProfitMargin"
                  type="number"
                  step="0.01"
                  value={formData.defaultProfitMargin || 30}
                  onChange={(e) => handleNumberChange('defaultProfitMargin', e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Este porcentaje se suma al precio base
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDiscount">Descuento (%)</Label>
                <Input
                  id="defaultDiscount"
                  type="number"
                  step="0.01"
                  value={formData.defaultDiscount || 0}
                  onChange={(e) => handleNumberChange('defaultDiscount', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Este porcentaje se resta del precio con margen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impuestos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Configuración de Impuestos
            </CardTitle>
            <CardDescription>
              Configura el IVA u otros impuestos aplicables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Impuesto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate || 0}
                  onChange={(e) => handleNumberChange('taxRate', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: 16 para IVA del 16%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applyTaxToFinalPrice" className="flex items-center gap-2">
                  Aplicar Impuesto al Precio Final
                </Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="applyTaxToFinalPrice"
                    checked={formData.applyTaxToFinalPrice !== false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, applyTaxToFinalPrice: checked })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.applyTaxToFinalPrice !== false ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Si está activado, el impuesto se suma al precio final
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Cálculo */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              Orden de Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Precio Base (USD o V-Bucks convertidos)</li>
              <li>+ Margen de Ganancia ({formData.defaultProfitMargin || 30}%)</li>
              <li>- Descuentos (por item, categoría, tier de cliente)</li>
              <li>+ Impuesto ({formData.taxRate || 0}%) {formData.applyTaxToFinalPrice !== false ? '✓' : '✗'}</li>
              <li>× Tasa de Cambio a Moneda Local ({formData.usdToLocalRate || 1.0})</li>
              <li>= Precio Final en {formData.currencyCode || 'USD'}</li>
            </ol>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFormData(config)}
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
          <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
        )}
      </div>
    </>
  );
}
