'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, TrendingDown, Users, Mail, Calendar, Package } from 'lucide-react';

export default function CheckoutAbandonmentPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['checkout-abandonment', period],
    queryFn: () => analyticsApi.getCheckoutAbandonment({ period, limit: 100 }),
  });

  const summary = data?.summary;
  const orders = data?.abandonedOrders || [];

  return (
    <>
      <Header title="Abandono de Checkout" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Period Selector */}
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mes</SelectItem>
              <SelectItem value="all">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checkouts Iniciados</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalCheckouts || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abandonados</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{summary?.abandonedCheckouts || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.abandonmentRate?.toFixed(1)}% tasa de abandono
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completados</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{summary?.completedCheckouts || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.conversionRate?.toFixed(1)}% conversión
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Con Datos de Contacto</CardTitle>
                  <Mail className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{summary?.ordersWithContactInfo || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Para follow-up
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Abandoned Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Abandonadas</CardTitle>
                <CardDescription>
                  Usuarios que iniciaron el checkout pero no completaron la compra
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay órdenes abandonadas en este período
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-sm font-medium">Orden</th>
                          <th className="text-left p-2 text-sm font-medium">Cliente</th>
                          <th className="text-left p-2 text-sm font-medium">Producto</th>
                          <th className="text-left p-2 text-sm font-medium">Precio</th>
                          <th className="text-left p-2 text-sm font-medium">Tipo</th>
                          <th className="text-left p-2 text-sm font-medium">Fecha</th>
                          <th className="text-left p-2 text-sm font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order: any) => (
                          <tr key={order.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-sm font-mono">{order.orderNumber}</td>
                            <td className="p-2">
                              <div className="text-sm">
                                <div className="font-medium">{order.customerName}</div>
                                {order.hasContactInfo && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {order.email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-sm">{order.productName}</td>
                            <td className="p-2 text-sm font-medium">${order.price?.toFixed(2)}</td>
                            <td className="p-2">
                              {order.hasManualItems ? (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                                  <Package className="w-3 h-3 mr-1" />
                                  Manual
                                </Badge>
                              ) : (
                                <Badge variant="outline">Auto</Badge>
                              )}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(order.checkoutStartedAt).toLocaleString('es-AR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge
                                variant={
                                  order.status === 'EXPIRED'
                                    ? 'destructive'
                                    : order.status === 'ABANDONED'
                                      ? 'secondary'
                                      : 'default'
                                }
                              >
                                {order.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
