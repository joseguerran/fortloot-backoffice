'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi, type CheckoutMode } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Settings, ShoppingCart, MessageSquare, Bot, Check, Wrench, Phone, Bitcoin } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Fetch checkout mode
  const { data: checkoutMode, isLoading } = useQuery<CheckoutMode>({
    queryKey: ['checkout-mode'],
    queryFn: () => configApi.getCheckoutMode(),
  });

  // Fetch manual checkout enabled
  const { data: manualCheckoutEnabled, isLoading: isLoadingManual } = useQuery<boolean>({
    queryKey: ['manual-checkout-enabled'],
    queryFn: () => configApi.getManualCheckoutEnabled(),
  });

  // Fetch WhatsApp notifications enabled
  const { data: whatsappEnabled, isLoading: isLoadingWhatsApp } = useQuery<boolean>({
    queryKey: ['whatsapp-enabled'],
    queryFn: () => configApi.getWhatsAppEnabled(),
  });

  // Fetch crypto payments enabled
  const { data: cryptoPaymentsEnabled, isLoading: isLoadingCrypto } = useQuery<boolean>({
    queryKey: ['crypto-payments-enabled'],
    queryFn: () => configApi.getCryptoPaymentsEnabled(),
  });

  // Update checkout mode mutation
  const updateMutation = useMutation({
    mutationFn: (mode: CheckoutMode) => configApi.setCheckoutMode(mode),
    onSuccess: () => {
      toast.success('Modo de checkout actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['checkout-mode'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Update manual checkout mutation
  const updateManualMutation = useMutation({
    mutationFn: (enabled: boolean) => configApi.setManualCheckoutEnabled(enabled),
    onSuccess: () => {
      toast.success('Configuración de checkout manual actualizada');
      queryClient.invalidateQueries({ queryKey: ['manual-checkout-enabled'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Update WhatsApp notifications mutation
  const updateWhatsAppMutation = useMutation({
    mutationFn: (enabled: boolean) => configApi.setWhatsAppEnabled(enabled),
    onSuccess: () => {
      toast.success('Configuración de WhatsApp actualizada');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-enabled'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Update crypto payments mutation
  const updateCryptoMutation = useMutation({
    mutationFn: (enabled: boolean) => configApi.setCryptoPaymentsEnabled(enabled),
    onSuccess: () => {
      toast.success('Configuración de pagos crypto actualizada');
      queryClient.invalidateQueries({ queryKey: ['crypto-payments-enabled'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const handleModeChange = (mode: CheckoutMode) => {
    updateMutation.mutate(mode);
  };

  const modes = [
    {
      id: 'whatsapp' as CheckoutMode,
      name: 'WhatsApp Manual',
      description: 'Los clientes finalizan la compra enviando un mensaje a WhatsApp con los artículos del carrito.',
      icon: MessageSquare,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      activeColor: 'bg-green-500',
    },
    {
      id: 'wizard' as CheckoutMode,
      name: 'Checkout Automatizado',
      description: 'Proceso de checkout de 4 pasos: verificación Epic ID, método de pago, confirmación y comprobante.',
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      activeColor: 'bg-blue-500',
    },
    {
      id: 'bot-wizard' as CheckoutMode,
      name: 'Bot Automatizado',
      description: 'Checkout completamente automático mediante bot (próximamente). El bot procesa todo el flujo.',
      icon: Bot,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      activeColor: 'bg-purple-500',
      disabled: true,
    },
  ];

  return (
    <>
      <Header title="Configuración del Sistema" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {(isLoading || isLoadingManual || isLoadingWhatsApp || isLoadingCrypto) ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {/* Manual Checkout Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Checkout Manual para Items Especiales
                </CardTitle>
                <CardDescription>
                  Habilita un flujo especial de checkout cuando el carrito contiene items que requieren
                  procesamiento manual. Los clientes serán dirigidos a WhatsApp después de capturar sus datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Activar Checkout Manual</h3>
                    <p className="text-sm text-muted-foreground">
                      Cuando está activo, los items marcados como "manuales" mostrarán un mensaje
                      especial y redirigirán a WhatsApp en lugar del checkout normal.
                    </p>
                  </div>
                  <Switch
                    checked={manualCheckoutEnabled || false}
                    onCheckedChange={(checked) => updateManualMutation.mutate(checked)}
                    disabled={updateManualMutation.isPending}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Estado:</strong>{' '}
                    {manualCheckoutEnabled ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-gray-600 font-semibold">Desactivado</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esta configuración permite preparar el sistema para una futura automatización
                    completa mediante bots, mientras tanto se usa proceso manual vía WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Notificaciones WhatsApp (Admin)
                </CardTitle>
                <CardDescription>
                  Recibe notificaciones por WhatsApp cuando se crean nuevas órdenes o los clientes suben
                  comprobantes de pago. Requiere WAHA configurado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Activar Notificaciones WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">
                      Cuando está activo, recibirás alertas por WhatsApp en los siguientes eventos:
                      nueva orden creada y comprobante de pago subido.
                    </p>
                  </div>
                  <Switch
                    checked={whatsappEnabled || false}
                    onCheckedChange={(checked) => updateWhatsAppMutation.mutate(checked)}
                    disabled={updateWhatsAppMutation.isPending}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Estado:</strong>{' '}
                    {whatsappEnabled ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-gray-600 font-semibold">Desactivado</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Asegúrate de tener configuradas las variables <code className="bg-muted px-1 rounded">WAHA_API_URL</code> y{' '}
                    <code className="bg-muted px-1 rounded">ADMIN_WHATSAPP</code> en el backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Crypto Payments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="w-5 h-5" />
                  Pagos con Criptomonedas
                </CardTitle>
                <CardDescription>
                  Habilita o deshabilita pagos con criptomonedas a través de Cryptomus.
                  Los clientes podrán pagar con Bitcoin, USDT y otras criptomonedas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Activar Pagos Crypto</h3>
                    <p className="text-sm text-muted-foreground">
                      Cuando está activo, los clientes verán la opción de pagar con criptomonedas
                      en el checkout. Requiere configuración de Cryptomus.
                    </p>
                  </div>
                  <Switch
                    checked={cryptoPaymentsEnabled || false}
                    onCheckedChange={(checked) => updateCryptoMutation.mutate(checked)}
                    disabled={updateCryptoMutation.isPending}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Estado:</strong>{' '}
                    {cryptoPaymentsEnabled ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-gray-600 font-semibold">Desactivado</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Asegúrate de tener configuradas las variables <code className="bg-muted px-1 rounded">CRYPTOMUS_API_KEY</code> y{' '}
                    <code className="bg-muted px-1 rounded">CRYPTOMUS_MERCHANT_ID</code> en el backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Mode Card */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Modo de Checkout
              </CardTitle>
              <CardDescription>
                Selecciona cómo quieres que tus clientes finalicen sus compras en la tienda online.
                Puedes cambiar esto en cualquier momento sin afectar las órdenes existentes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = checkoutMode === mode.id;
                  const isDisabled = mode.disabled || updateMutation.isPending;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => !isDisabled && handleModeChange(mode.id)}
                      disabled={isDisabled}
                      className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                        isActive
                          ? `${mode.borderColor} ${mode.bgColor} ring-2 ring-offset-2 ring-offset-background`
                          : 'border-border hover:border-muted-foreground/50'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                    >
                      {/* Badge de seleccionado */}
                      {isActive && (
                        <div
                          className={`absolute -top-2 -right-2 w-8 h-8 ${mode.activeColor} rounded-full flex items-center justify-center shadow-lg`}
                        >
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}

                      {/* Icono y título */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${mode.bgColor}`}>
                          <Icon className={`w-6 h-6 ${mode.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">{mode.name}</h3>
                          {mode.disabled && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              Próximamente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-sm text-muted-foreground leading-relaxed">{mode.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Información adicional */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Modo Actual
                </h4>
                <p className="text-sm text-muted-foreground">
                  {checkoutMode === 'whatsapp' && (
                    <>
                      <span className="font-semibold text-green-600">WhatsApp Manual</span> - Los clientes son
                      redirigidos a WhatsApp para completar la compra.
                    </>
                  )}
                  {checkoutMode === 'wizard' && (
                    <>
                      <span className="font-semibold text-blue-600">Checkout Automatizado</span> - Los clientes
                      completan el proceso de pago en 4 pasos dentro del sitio.
                    </>
                  )}
                  {checkoutMode === 'bot-wizard' && (
                    <>
                      <span className="font-semibold text-purple-600">Bot Automatizado</span> - El sistema procesa
                      automáticamente las compras mediante bot.
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </>
  );
}
