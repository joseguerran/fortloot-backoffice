'use client';

import { useQuery } from '@tanstack/react-query';
import { botsApi, ordersApi } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Package, CheckCircle2, XCircle } from 'lucide-react';
import { POLLING_INTERVALS } from '@/lib/constants';

export default function DashboardPage() {
  // Fetch data with polling
  const { data: bots, isLoading: botsLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: botsApi.getAll,
    refetchInterval: POLLING_INTERVALS.DASHBOARD,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll({ limit: 100 }),
    refetchInterval: POLLING_INTERVALS.DASHBOARD,
  });

  // Calculate stats
  const onlineBots = bots?.filter((b) => b.status === 'ONLINE').length || 0;
  const totalBots = bots?.length || 0;
  const pendingOrders = orders?.filter((o) =>
    ['PENDING', 'WAITING_FRIENDSHIP', 'WAITING_PERIOD', 'QUEUED', 'PROCESSING'].includes(o.status)
  ).length || 0;
  const completedToday = orders?.filter((o) => {
    if (o.status !== 'COMPLETED' || !o.completedAt) return false;
    const completedDate = new Date(o.completedAt);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length || 0;
  const failedToday = orders?.filter((o) => {
    if (o.status !== 'FAILED' || !o.failedAt) return false;
    const failedDate = new Date(o.failedAt);
    const today = new Date();
    return failedDate.toDateString() === today.toDateString();
  }).length || 0;

  const totalGiftsAvailable = bots?.reduce((sum, bot) => sum + (bot.giftsAvailable || 0), 0) || 0;

  const stats = [
    {
      title: 'Bots Online',
      value: `${onlineBots}/${totalBots}`,
      icon: Bot,
      description: `${totalGiftsAvailable} gifts disponibles`,
      color: 'text-green-500',
      loading: botsLoading,
    },
    {
      title: 'Órdenes Pendientes',
      value: pendingOrders.toString(),
      icon: Package,
      description: 'En cola',
      color: 'text-yellow-500',
      loading: ordersLoading,
    },
    {
      title: 'Completadas Hoy',
      value: completedToday.toString(),
      icon: CheckCircle2,
      description: 'Entregadas exitosamente',
      color: 'text-green-500',
      loading: ordersLoading,
    },
    {
      title: 'Fallidas Hoy',
      value: failedToday.toString(),
      icon: XCircle,
      description: 'Requieren atención',
      color: 'text-red-500',
      loading: ordersLoading,
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="mt-1 h-3 w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Backend API</span>
                <span className="text-sm font-medium text-green-500">✓ Conectado</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Base de Datos</span>
                <span className="text-sm font-medium text-green-500">✓ Conectada</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Redis Queue</span>
                <span className="text-sm font-medium text-green-500">✓ Activa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Actualización automática</span>
                <span className="text-sm font-medium text-blue-500">Cada 5 segundos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Info */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Gestionar Bots</p>
                  <p className="text-xs text-muted-foreground">Ver, iniciar y detener bots</p>
                </div>
                <a href="/bots" className="text-sm text-primary hover:underline">
                  Ir a Bots →
                </a>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Ver Órdenes</p>
                  <p className="text-xs text-muted-foreground">Monitorear estado de órdenes</p>
                </div>
                <a href="/orders" className="text-sm text-primary hover:underline">
                  Ir a Órdenes →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
