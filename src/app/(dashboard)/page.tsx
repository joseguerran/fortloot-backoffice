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
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs font-medium sm:text-sm">{stat.title}</CardTitle>
                <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                {stat.loading ? (
                  <>
                    <Skeleton className="h-6 w-12 sm:h-8 sm:w-16" />
                    <Skeleton className="mt-1 h-3 w-20 sm:w-32" />
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
                    <p className="text-[10px] text-muted-foreground sm:text-xs truncate">{stat.description}</p>
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
              <a href="/bots" className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:bg-white/5 hover:border-primary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Gestionar Bots</p>
                  <p className="text-xs text-muted-foreground truncate">Ver, iniciar y detener bots</p>
                </div>
                <span className="text-sm text-primary ml-2 shrink-0">→</span>
              </a>
              <a href="/orders" className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:bg-white/5 hover:border-primary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Ver Órdenes</p>
                  <p className="text-xs text-muted-foreground truncate">Monitorear estado de órdenes</p>
                </div>
                <span className="text-sm text-primary ml-2 shrink-0">→</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
