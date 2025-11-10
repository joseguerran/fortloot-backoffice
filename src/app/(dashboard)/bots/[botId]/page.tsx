'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { botsApi } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/dashboard/header';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Search, RefreshCw, Users, CheckCircle2, Clock, XCircle, AlertCircle, UserPlus, Play, Square, RotateCw, Trash2, Activity, Gift, MessageSquare, AlertTriangle, UserCheck, UserMinus, Coins, FileText } from 'lucide-react';
import { POLLING_INTERVALS } from '@/lib/constants';
import type { Friendship, BotActivity, BotActivityType } from '@/types/api';
import { BotErrorLog } from '@/components/BotErrorLog';

const STATUS_BADGE_VARIANT: Record<string, any> = {
  PENDING: 'secondary',
  ACCEPTED: 'default',
  WAIT_PERIOD: 'secondary',
  READY: 'default',
  REJECTED: 'destructive',
  REMOVED: 'destructive',
};

const STATUS_ICON: Record<string, any> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle2,
  WAIT_PERIOD: Clock,
  READY: CheckCircle2,
  REJECTED: XCircle,
  REMOVED: XCircle,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-500',
  ACCEPTED: 'text-green-500',
  WAIT_PERIOD: 'text-blue-500',
  READY: 'text-green-500',
  REJECTED: 'text-red-500',
  REMOVED: 'text-gray-500',
};

const ACTIVITY_ICON: Record<BotActivityType, any> = {
  BOT_STARTED: Play,
  BOT_STOPPED: Square,
  BOT_ERROR: AlertTriangle,
  FRIEND_REQUEST_RECEIVED: UserPlus,
  FRIEND_ADDED: UserCheck,
  FRIEND_REMOVED: UserMinus,
  GIFT_SENT: Gift,
  GIFT_FAILED: XCircle,
  MESSAGE_RECEIVED: MessageSquare,
  MESSAGE_SENT: MessageSquare,
  FRIENDS_SYNCED: RefreshCw,
  VBUCKS_UPDATED: Coins,
};

const ACTIVITY_COLOR: Record<BotActivityType, string> = {
  BOT_STARTED: 'text-green-500',
  BOT_STOPPED: 'text-gray-500',
  BOT_ERROR: 'text-red-500',
  FRIEND_REQUEST_RECEIVED: 'text-blue-500',
  FRIEND_ADDED: 'text-green-500',
  FRIEND_REMOVED: 'text-orange-500',
  GIFT_SENT: 'text-purple-500',
  GIFT_FAILED: 'text-red-500',
  MESSAGE_RECEIVED: 'text-blue-500',
  MESSAGE_SENT: 'text-blue-500',
  FRIENDS_SYNCED: 'text-cyan-500',
  VBUCKS_UPDATED: 'text-yellow-500',
};

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.botId as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: bot, isLoading: botLoading } = useQuery({
    queryKey: ['bot', botId],
    queryFn: () => botsApi.getOne(botId),
    refetchInterval: POLLING_INTERVALS.BOTS,
  });

  const { data: friendsData, isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ['bot-friends', botId],
    queryFn: () => botsApi.getFriends(botId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['bot-activities', botId],
    queryFn: () => botsApi.getActivities(botId, 50, 0),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const syncFriendsMutation = useMutation({
    mutationFn: () => botsApi.syncFriends(botId),
    onSuccess: (data) => {
      toast.success(`Sincronización completa: ${data.newFriendsAdded} nuevos amigos agregados`, {
        description: `Total en Epic: ${data.totalInEpic}, Ya en BD: ${data.alreadyInDatabase}`,
      });
      queryClient.invalidateQueries({ queryKey: ['bot-friends', botId] });
    },
    onError: (error: any) => {
      toast.error(`Error al sincronizar: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    },
  });

  const handleSyncFriends = () => {
    syncFriendsMutation.mutate();
  };

  const handleStart = async () => {
    try {
      await botsApi.start(botId);
      toast.success(`Bot ${bot?.displayName} iniciado`);
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleStop = async () => {
    try {
      await botsApi.stop(botId);
      toast.success(`Bot ${bot?.displayName} detenido`);
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleRestart = async () => {
    try {
      await botsApi.restart(botId);
      toast.success(`Bot ${bot?.displayName} reiniciado`);
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de eliminar el bot "${bot?.displayName}"?`)) {
      return;
    }
    try {
      await botsApi.delete(botId);
      toast.success(`Bot ${bot?.displayName} eliminado`);
      router.push('/bots');
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  // Filter friends based on search and status
  const filteredFriends = friendsData?.friends.filter((friend: Friendship) => {
    const matchesSearch =
      friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.epicAccountId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || friend.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  // Count friends by status
  const friendStats = {
    total: friendsData?.total || 0,
    ready: friendsData?.friends.filter((f: Friendship) => f.status === 'READY').length || 0,
    pending: friendsData?.friends.filter((f: Friendship) => f.status === 'PENDING').length || 0,
    waitPeriod: friendsData?.friends.filter((f: Friendship) => f.status === 'WAIT_PERIOD').length || 0,
    live: friendsData?.onlineInEpic || 0,
  };

  const isCanGift = (friend: Friendship): boolean => {
    return friend.status === 'READY' && new Date(friend.canGiftAt) <= new Date();
  };

  const getTimeUntilGift = (friend: Friendship): string => {
    const now = new Date();
    const canGiftDate = new Date(friend.canGiftAt);

    if (canGiftDate <= now) {
      return 'Disponible ahora';
    }

    const diffMs = canGiftDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    }

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }

    return `${diffMins}m`;
  };

  return (
    <>
      <Header
        title={bot?.displayName || 'Bot Details'}
        subtitle={bot?.epicAccountId || ''}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Back Button and Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/bots')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Bots
          </Button>

          <div className="flex gap-2">
            {bot?.status === 'OFFLINE' ? (
              <Button
                size="sm"
                onClick={handleStart}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Detener
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestart}
              className="gap-2"
              disabled={bot?.status === 'OFFLINE'}
            >
              <RotateCw className="h-4 w-4" />
              Reiniciar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Bot Info Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                bot?.status === 'ONLINE' ? 'bg-green-500' :
                bot?.status === 'OFFLINE' ? 'bg-gray-500' :
                bot?.status === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <div className="text-sm text-muted-foreground">Estado</div>
            </div>
            <div className="text-2xl font-bold mt-1">{bot?.status || '-'}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">V-Bucks</div>
            <div className="text-2xl font-bold text-purple-500">{bot?.vBucks?.toLocaleString() || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Gifts Disponibles</div>
            <div className="text-2xl font-bold text-green-500">{bot?.giftsAvailable || 0}/{bot?.maxGiftsPerDay || 5}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Gifts Usados Hoy</div>
            <div className="text-2xl font-bold">{bot?.giftsToday || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Amigos</div>
            <div className="text-2xl font-bold">{friendStats.total}</div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList>
            <TabsTrigger value="friends">
              <Users className="mr-2 h-4 w-4" />
              Amigos
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Activity className="mr-2 h-4 w-4" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="mr-2 h-4 w-4" />
              Logs de Errores
            </TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-4">
            {/* Friends Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{friendStats.total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Listos para Gifts</div>
                <div className="text-2xl font-bold text-green-500">{friendStats.ready}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Pendientes</div>
                <div className="text-2xl font-bold text-yellow-500">{friendStats.pending}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">En Epic</div>
                <div className="text-2xl font-bold text-blue-500">{friendStats.live}</div>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o Epic ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === 'READY' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('READY')}
                  >
                    Listos
                  </Button>
                  <Button
                    variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('PENDING')}
                  >
                    Pendientes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncFriends()}
                    disabled={syncFriendsMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {syncFriendsMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchFriends()}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Friends Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Epic Account ID</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>En Epic</TableHead>
                    <TableHead>Disponible para Gift</TableHead>
                    <TableHead>Amigos desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {friendsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredFriends.length > 0 ? (
                    filteredFriends.map((friend: Friendship) => {
                      const StatusIcon = STATUS_ICON[friend.status] || AlertCircle;
                      return (
                        <TableRow key={friend.epicAccountId}>
                          <TableCell className="font-medium">{friend.displayName}</TableCell>
                          <TableCell className="font-mono text-xs">{friend.epicAccountId}</TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGE_VARIANT[friend.status]}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {friend.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {friend.isLive ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            {isCanGift(friend) ? (
                              <span className="text-green-500 font-medium">Disponible</span>
                            ) : (
                              <span className="text-muted-foreground">{getTimeUntilGift(friend)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(friend.friendedAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchQuery || statusFilter !== 'all'
                              ? 'No se encontraron amigos con los filtros aplicados'
                              : 'Este bot aún no tiene amigos'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Actividades Recientes</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchActivities()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {activitiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border-b">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activitiesData && activitiesData.activities.length > 0 ? (
                <div className="space-y-2">
                  {activitiesData.activities.map((activity: BotActivity) => {
                    const ActivityIcon = ACTIVITY_ICON[activity.type] || Activity;
                    const iconColor = ACTIVITY_COLOR[activity.type] || 'text-gray-500';

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay actividades registradas</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Logs de Errores del Bot</h3>
              <BotErrorLog botId={botId} autoRefresh={true} refreshInterval={30000} />
            </Card>
          </TabsContent>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Bot</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Nombre</div>
                  <div className="font-medium">{bot?.name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Display Name</div>
                  <div className="font-medium">{bot?.displayName || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Epic Account ID</div>
                  <div className="font-mono text-sm">{bot?.epicAccountId || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estado</div>
                  <Badge variant={STATUS_BADGE_VARIANT[bot?.status || 'OFFLINE']}>
                    {bot?.status || 'OFFLINE'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">V-Bucks</div>
                  <div className="font-medium text-purple-600">{bot?.vBucks?.toLocaleString() || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Activo</div>
                  <div className="font-medium">{bot?.isActive ? 'Sí' : 'No'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Prioridad</div>
                  <div className="font-medium">{bot?.priority || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Máximo Gifts por Día</div>
                  <div className="font-medium">{bot?.maxGiftsPerDay || 5}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                  <div className="font-medium">{bot?.uptime ? `${Math.floor(bot.uptime / 60)} min` : '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Último Heartbeat</div>
                  <div className="font-medium text-sm">
                    {bot?.lastHeartbeat ? new Date(bot.lastHeartbeat).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Último Reset de Gifts</div>
                  <div className="font-medium text-sm">
                    {bot?.lastGiftReset ? new Date(bot.lastGiftReset).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Creado</div>
                  <div className="font-medium text-sm">
                    {bot?.createdAt ? new Date(bot.createdAt).toLocaleString() : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Actualizado</div>
                  <div className="font-medium text-sm">
                    {bot?.updatedAt ? new Date(bot.updatedAt).toLocaleString() : '-'}
                  </div>
                </div>
              </div>
              {bot?.lastError && (
                <div className="mt-6">
                  <div className="text-sm text-muted-foreground mb-1">Último Error</div>
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {bot.lastError}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
