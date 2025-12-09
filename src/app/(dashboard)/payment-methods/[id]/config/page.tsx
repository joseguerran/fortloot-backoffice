'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  paymentMethodsApi,
  exchangeRatesApi,
  PaymentMethod,
  PaymentMethodConfig,
  CurrencyConversionConfig,
  FeeConfig,
  ExchangeRateInfo,
} from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Settings,
  RefreshCw,
  Trash2,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Save,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function PaymentMethodConfigPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const paymentMethodId = params.id as string;

  // State for currency conversion config form
  const [currencyConversionForm, setCurrencyConversionForm] = useState<CurrencyConversionConfig>({
    targetCurrency: 'VES',
    rateProvider: 'binance_p2p',
    bankFilter: '',
    markup: 0,
    cacheTTLMin: 15,
  });
  const [currencyConversionEnabled, setCurrencyConversionEnabled] = useState(false);
  const [manualRateInput, setManualRateInput] = useState('');

  // State for fee config form
  const [feeForm, setFeeForm] = useState<FeeConfig>({
    feeType: 'COMPOUND',
    feeValue: 0,
    fixedFee: 0,
    description: '',
  });
  const [feeEnabled, setFeeEnabled] = useState(false);

  // Fetch payment method with configs
  const { data: paymentMethod, isLoading: isLoadingMethod } = useQuery({
    queryKey: ['payment-method', paymentMethodId],
    queryFn: () => paymentMethodsApi.getWithConfigs(paymentMethodId),
  });

  // Fetch exchange rate info (if currency conversion is configured)
  const currencyConfig = paymentMethod?.configs?.find(
    (c) => c.type === 'CURRENCY_CONVERSION'
  );
  const targetCurrency = currencyConfig
    ? (currencyConfig.config as CurrencyConversionConfig).targetCurrency
    : null;

  const feeConfig = paymentMethod?.configs?.find(
    (c) => c.type === 'FEE'
  );

  const { data: rateInfo, isLoading: isLoadingRate, refetch: refetchRate } = useQuery({
    queryKey: ['exchange-rate-info', targetCurrency],
    queryFn: () => exchangeRatesApi.getRateInfo(targetCurrency!),
    enabled: !!targetCurrency,
  });

  // Populate forms when data loads
  useEffect(() => {
    if (currencyConfig) {
      const config = currencyConfig.config as CurrencyConversionConfig;
      setCurrencyConversionForm({
        targetCurrency: config.targetCurrency || 'VES',
        rateProvider: config.rateProvider || 'binance_p2p',
        bankFilter: config.bankFilter || '',
        markup: config.markup || 0,
        cacheTTLMin: config.cacheTTLMin || 15,
      });
      setCurrencyConversionEnabled(currencyConfig.enabled);
    }
  }, [currencyConfig]);

  useEffect(() => {
    if (feeConfig) {
      const config = feeConfig.config as FeeConfig;
      setFeeForm({
        feeType: config.feeType || 'COMPOUND',
        feeValue: config.feeValue || 0,
        fixedFee: config.fixedFee || 0,
        description: config.description || '',
      });
      setFeeEnabled(feeConfig.enabled);
    }
  }, [feeConfig]);

  // Mutations
  const upsertConfigMutation = useMutation({
    mutationFn: ({
      type,
      config,
      enabled,
    }: {
      type: 'CURRENCY_CONVERSION' | 'FEE';
      config: CurrencyConversionConfig | FeeConfig;
      enabled: boolean;
    }) => paymentMethodsApi.upsertConfig(paymentMethodId, type, config, enabled),
    onSuccess: () => {
      toast.success('Configuracion guardada correctamente');
      queryClient.invalidateQueries({ queryKey: ['payment-method', paymentMethodId] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-info'] });
    },
    onError: (error: any) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (type: 'CURRENCY_CONVERSION' | 'FEE') =>
      paymentMethodsApi.deleteConfig(paymentMethodId, type),
    onSuccess: () => {
      toast.success('Configuracion eliminada');
      queryClient.invalidateQueries({ queryKey: ['payment-method', paymentMethodId] });
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  const fetchRateMutation = useMutation({
    mutationFn: () => exchangeRatesApi.fetchRate(currencyConversionForm.targetCurrency),
    onSuccess: (data) => {
      toast.success(`Tasa actualizada: ${data.rate} ${currencyConversionForm.targetCurrency}/USD`);
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-info'] });
    },
    onError: (error: any) => {
      toast.error(`Error al obtener tasa: ${error.message}`);
    },
  });

  const invalidateCacheMutation = useMutation({
    mutationFn: () => exchangeRatesApi.invalidateCache(currencyConversionForm.targetCurrency),
    onSuccess: () => {
      toast.success('Cache invalidado');
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-info'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const setManualRateMutation = useMutation({
    mutationFn: (rate: number) =>
      exchangeRatesApi.setManualRate(currencyConversionForm.targetCurrency, rate),
    onSuccess: (data) => {
      toast.success(`Tasa manual establecida: ${data.manualRate}`);
      setManualRateInput('');
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-info'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const clearManualRateMutation = useMutation({
    mutationFn: () => exchangeRatesApi.clearManualRate(currencyConversionForm.targetCurrency),
    onSuccess: () => {
      toast.success('Tasa manual eliminada');
      queryClient.invalidateQueries({ queryKey: ['exchange-rate-info'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSaveCurrencyConversion = () => {
    upsertConfigMutation.mutate({
      type: 'CURRENCY_CONVERSION',
      config: currencyConversionForm,
      enabled: currencyConversionEnabled,
    });
  };

  const handleSaveFee = () => {
    // Validación según tipo de comisión
    if (feeForm.feeType === 'COMPOUND') {
      if (feeForm.feeValue <= 0 && (feeForm.fixedFee || 0) <= 0) {
        toast.error('Debes configurar al menos un porcentaje o un monto fijo');
        return;
      }
    } else if (feeForm.feeType === 'FIXED') {
      if ((feeForm.fixedFee || feeForm.feeValue) <= 0) {
        toast.error('El monto fijo debe ser mayor a 0');
        return;
      }
    } else if (feeForm.feeValue <= 0) {
      toast.error('El porcentaje debe ser mayor a 0');
      return;
    }
    upsertConfigMutation.mutate({
      type: 'FEE',
      config: feeForm,
      enabled: feeEnabled,
    });
  };

  const handleSetManualRate = () => {
    const rate = parseFloat(manualRateInput);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Ingresa una tasa valida');
      return;
    }
    setManualRateMutation.mutate(rate);
  };

  if (isLoadingMethod) {
    return (
      <>
        <Header title="Configuracion de Metodo de Pago" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  if (!paymentMethod) {
    return (
      <>
        <Header title="Configuracion de Metodo de Pago" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Metodo de Pago No Encontrado</h3>
              <Button onClick={() => router.push('/payment-methods')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Metodos de Pago
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`Configuracion: ${paymentMethod.name}`} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/payment-methods')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Badge variant={paymentMethod.isActive ? 'default' : 'secondary'}>
            {paymentMethod.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* Payment Method Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {paymentMethod.name}
            </CardTitle>
            <CardDescription>
              <code className="text-xs bg-muted px-2 py-1 rounded">{paymentMethod.slug}</code>
              {paymentMethod.description && (
                <span className="ml-2">{paymentMethod.description}</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Currency Conversion Config */}
        <Card className={!currencyConversionEnabled && !currencyConfig ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Conversion de Moneda
                  {currencyConfig && (
                    <Badge variant="outline" className="ml-2 text-xs">Configurado</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {currencyConversionEnabled || currencyConfig
                    ? 'Configura la conversion automatica de USD a otra moneda'
                    : 'Habilita esta opcion para convertir precios a otra moneda (ej: Bolivares)'}
                </CardDescription>
              </div>
              <Switch
                checked={currencyConversionEnabled}
                onCheckedChange={setCurrencyConversionEnabled}
              />
            </div>
          </CardHeader>
          {(currencyConversionEnabled || currencyConfig) && (
          <CardContent className="space-y-6">
            {/* Config Form */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetCurrency">Moneda Destino</Label>
                <Select
                  value={currencyConversionForm.targetCurrency}
                  onValueChange={(value) =>
                    setCurrencyConversionForm({ ...currencyConversionForm, targetCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VES">VES (Bolivar Venezolano)</SelectItem>
                    <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                    <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                    <SelectItem value="ARS">ARS (Peso Argentino)</SelectItem>
                    <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                    <SelectItem value="PEN">PEN (Sol Peruano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateProvider">Proveedor de Tasa</Label>
                <Select
                  value={currencyConversionForm.rateProvider}
                  onValueChange={(value) =>
                    setCurrencyConversionForm({ ...currencyConversionForm, rateProvider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance_p2p">Binance P2P</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currencyConversionForm.rateProvider === 'binance_p2p' && (
                <div className="space-y-2">
                  <Label htmlFor="bankFilter">Filtro de Banco</Label>
                  <Input
                    id="bankFilter"
                    value={currencyConversionForm.bankFilter || ''}
                    onChange={(e) =>
                      setCurrencyConversionForm({
                        ...currencyConversionForm,
                        bankFilter: e.target.value,
                      })
                    }
                    placeholder="Ej: Mercantil, Banesco"
                  />
                  <p className="text-xs text-muted-foreground">
                    Filtrar ofertas por banco especifico (opcional)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="markup">Markup Adicional</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.01"
                  value={currencyConversionForm.markup}
                  onChange={(e) =>
                    setCurrencyConversionForm({
                      ...currencyConversionForm,
                      markup: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Monto adicional en {currencyConversionForm.targetCurrency} sobre la tasa
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cacheTTL">Cache TTL (minutos)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  min="1"
                  max="1440"
                  value={currencyConversionForm.cacheTTLMin}
                  onChange={(e) =>
                    setCurrencyConversionForm({
                      ...currencyConversionForm,
                      cacheTTLMin: parseInt(e.target.value) || 15,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Tiempo de validez de la tasa en cache
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveCurrencyConversion} disabled={upsertConfigMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {upsertConfigMutation.isPending ? 'Guardando...' : 'Guardar Configuracion'}
              </Button>
              {currencyConfig && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Config
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar configuracion?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. Se eliminara la configuracion de
                        conversion de moneda.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteConfigMutation.mutate('CURRENCY_CONVERSION')}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Si, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Exchange Rate Info (only if config exists and has target currency) */}
            {targetCurrency && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tasa Actual: {targetCurrency}
                  </h4>

                  {isLoadingRate ? (
                    <Skeleton className="h-32 w-full" />
                  ) : rateInfo ? (
                    <div className="space-y-4">
                      {/* Current Rate Display */}
                      <div className="grid gap-4 md:grid-cols-4 bg-muted p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Tasa Actual</p>
                          <p className="text-2xl font-bold">
                            {rateInfo.currentRate?.toFixed(2) || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {targetCurrency}/USD
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tasa Raw</p>
                          <p className="text-lg font-medium">
                            {rateInfo.rawRate?.toFixed(2) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fuente</p>
                          <Badge variant={rateInfo.isManual ? 'secondary' : 'default'}>
                            {rateInfo.isManual ? 'Manual' : rateInfo.source || 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estado</p>
                          {rateInfo.isExpired ? (
                            <Badge variant="destructive">Expirado</Badge>
                          ) : (
                            <Badge variant="default">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Valido
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="grid gap-4 md:grid-cols-2 text-sm">
                        {rateInfo.fetchedAt && (
                          <div>
                            <span className="text-muted-foreground">Obtenida: </span>
                            {format(new Date(rateInfo.fetchedAt), 'PPp')}
                          </div>
                        )}
                        {rateInfo.expiresAt && !rateInfo.isManual && (
                          <div>
                            <span className="text-muted-foreground">Expira: </span>
                            {format(new Date(rateInfo.expiresAt), 'PPp')}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchRateMutation.mutate()}
                          disabled={fetchRateMutation.isPending}
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${fetchRateMutation.isPending ? 'animate-spin' : ''}`}
                          />
                          {fetchRateMutation.isPending ? 'Obteniendo...' : 'Actualizar Tasa'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => invalidateCacheMutation.mutate()}
                          disabled={invalidateCacheMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Limpiar Cache
                        </Button>
                      </div>

                      {/* Manual Rate Section */}
                      <Separator />
                      <div>
                        <h5 className="font-medium mb-2">Tasa Manual (Override)</h5>
                        {rateInfo.isManual && rateInfo.manualRate && (
                          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                            <p className="text-sm">
                              <strong>Tasa manual activa:</strong> {rateInfo.manualRate}{' '}
                              {targetCurrency}/USD
                            </p>
                            {rateInfo.manualSetBy && (
                              <p className="text-xs text-muted-foreground">
                                Establecida por: {rateInfo.manualSetBy}
                                {rateInfo.manualSetAt &&
                                  ` el ${format(new Date(rateInfo.manualSetAt), 'PPp')}`}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 52.50"
                            value={manualRateInput}
                            onChange={(e) => setManualRateInput(e.target.value)}
                            className="max-w-[200px]"
                          />
                          <Button
                            variant="secondary"
                            onClick={handleSetManualRate}
                            disabled={setManualRateMutation.isPending || !manualRateInput}
                          >
                            Establecer
                          </Button>
                          {rateInfo.isManual && (
                            <Button
                              variant="outline"
                              onClick={() => clearManualRateMutation.mutate()}
                              disabled={clearManualRateMutation.isPending}
                            >
                              Quitar Manual
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          La tasa manual tiene prioridad sobre la tasa automatica
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay tasa almacenada para {targetCurrency}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => fetchRateMutation.mutate()}
                        disabled={fetchRateMutation.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Obtener Tasa
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
          )}
        </Card>

        {/* Fee Config */}
        <Card className={!feeEnabled && !feeConfig ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Comision Adicional
                  {feeConfig && (
                    <Badge variant="outline" className="ml-2 text-xs">Configurado</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {feeEnabled || feeConfig
                    ? 'Configura una comision extra para este metodo de pago (ej: 5% para PayPal)'
                    : 'Habilita esta opcion para agregar una comision adicional al precio'}
                </CardDescription>
              </div>
              <Switch
                checked={feeEnabled}
                onCheckedChange={setFeeEnabled}
              />
            </div>
          </CardHeader>
          {(feeEnabled || feeConfig) && (
          <CardContent className="space-y-6">
            {/* Fee Form */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="feeType">Tipo de Comision</Label>
                <Select
                  value={feeForm.feeType}
                  onValueChange={(value: 'PERCENTAGE' | 'FIXED' | 'COMPOUND') =>
                    setFeeForm({ ...feeForm, feeType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPOUND">Compuesta (% + Fijo) - Ej: PayPal</SelectItem>
                    <SelectItem value="PERCENTAGE">Solo Porcentaje (%)</SelectItem>
                    <SelectItem value="FIXED">Solo Monto Fijo (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Compuesta permite sumar un porcentaje mas un monto fijo (ej: 5.4% + $0.30)
                </p>
              </div>

              {/* Campos segun tipo */}
              {(feeForm.feeType === 'PERCENTAGE' || feeForm.feeType === 'COMPOUND') && (
                <div className="space-y-2">
                  <Label htmlFor="feeValue">Porcentaje (%)</Label>
                  <Input
                    id="feeValue"
                    type="number"
                    step="0.01"
                    min="0"
                    value={feeForm.feeValue}
                    onChange={(e) =>
                      setFeeForm({
                        ...feeForm,
                        feeValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Ej: 5.4"
                  />
                  <p className="text-xs text-muted-foreground">
                    Porcentaje sobre el subtotal (ej: 5.4 = 5.4%)
                  </p>
                </div>
              )}

              {(feeForm.feeType === 'FIXED' || feeForm.feeType === 'COMPOUND') && (
                <div className="space-y-2">
                  <Label htmlFor="fixedFee">Monto Fijo (USD)</Label>
                  <Input
                    id="fixedFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={feeForm.fixedFee || 0}
                    onChange={(e) =>
                      setFeeForm({
                        ...feeForm,
                        fixedFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Ej: 0.30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Monto fijo en USD (ej: 0.30 = $0.30)
                  </p>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="feeDescription">Descripcion para el cliente</Label>
                <Input
                  id="feeDescription"
                  value={feeForm.description || ''}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, description: e.target.value })
                  }
                  placeholder="Ej: Comision PayPal"
                />
                <p className="text-xs text-muted-foreground">
                  Este texto se mostrara al cliente en el desglose del pago
                </p>
              </div>
            </div>

            {/* Preview */}
            {(feeForm.feeValue > 0 || (feeForm.fixedFee || 0) > 0) && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Vista previa:</p>
                <p className="text-sm text-muted-foreground">
                  Para una compra de <strong>$10.00 USD</strong>:
                </p>
                {(() => {
                  let feeAmount = 0;
                  let feeBreakdown = '';
                  const subtotal = 10;

                  if (feeForm.feeType === 'PERCENTAGE') {
                    feeAmount = (subtotal * feeForm.feeValue) / 100;
                    feeBreakdown = `${feeForm.feeValue}%`;
                  } else if (feeForm.feeType === 'FIXED') {
                    feeAmount = feeForm.fixedFee || feeForm.feeValue;
                    feeBreakdown = `$${feeAmount.toFixed(2)}`;
                  } else if (feeForm.feeType === 'COMPOUND') {
                    const percentPart = (subtotal * feeForm.feeValue) / 100;
                    const fixedPart = feeForm.fixedFee || 0;
                    feeAmount = percentPart + fixedPart;
                    feeBreakdown = `${feeForm.feeValue}% + $${fixedPart.toFixed(2)}`;
                  }

                  return (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formula: {feeBreakdown}
                      </p>
                      <p className="text-lg font-bold mt-1">
                        {feeForm.description || 'Comision'}: ${feeAmount.toFixed(2)} USD
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total a pagar: ${(subtotal + feeAmount).toFixed(2)} USD
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSaveFee} disabled={upsertConfigMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {upsertConfigMutation.isPending ? 'Guardando...' : 'Guardar Comision'}
              </Button>
              {feeConfig && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar Comision
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar comision?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. Se eliminara la comision configurada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteConfigMutation.mutate('FEE')}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Si, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Current config status */}
            {feeConfig && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">
                  Comision configurada:{' '}
                  {(() => {
                    const cfg = feeConfig.config as FeeConfig;
                    if (cfg.feeType === 'COMPOUND') {
                      return `${cfg.feeValue}% + $${(cfg.fixedFee || 0).toFixed(2)}`;
                    } else if (cfg.feeType === 'PERCENTAGE') {
                      return `${cfg.feeValue}%`;
                    } else {
                      return `$${(cfg.fixedFee || cfg.feeValue).toFixed(2)}`;
                    }
                  })()}
                  {(feeConfig.config as FeeConfig).description &&
                    ` - ${(feeConfig.config as FeeConfig).description}`}
                </span>
              </div>
            )}
          </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
