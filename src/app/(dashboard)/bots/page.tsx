'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { botsApi } from '@/lib/api';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Play, Square, RotateCw, Trash2, Plus, ExternalLink } from 'lucide-react';
import { POLLING_INTERVALS } from '@/lib/constants';
import { toast } from 'sonner';
import type { Bot } from '@/types/api';

const STATUS_BADGE_VARIANT: Record<string, any> = {
  ONLINE: 'default',
  OFFLINE: 'secondary',
  BUSY: 'default',
  ERROR: 'destructive',
};

const STATUS_COLOR: Record<string, string> = {
  ONLINE: 'text-green-500',
  OFFLINE: 'text-gray-500',
  BUSY: 'text-yellow-500',
  ERROR: 'text-red-500',
};

export default function BotsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [secret, setSecret] = useState('');
  const [maxGifts, setMaxGifts] = useState('5');
  const queryClient = useQueryClient();

  const { data: bots, isLoading, refetch } = useQuery({
    queryKey: ['bots'],
    queryFn: botsApi.getAll,
    refetchInterval: POLLING_INTERVALS.BOTS,
  });

  const createMutation = useMutation({
    mutationFn: botsApi.create,
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setDisplayName('');
      setName('');
      setDeviceId('');
      setAccountId('');
      setSecret('');
      setMaxGifts('5');
      toast.success('Bot creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
    onError: (error: any) => {
      toast.error(`Error al crear bot: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    },
  });

  const handleStart = async (bot: Bot) => {
    try {
      await botsApi.start(bot.id);
      toast.success(`Bot ${bot.displayName} iniciado`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleStop = async (bot: Bot) => {
    try {
      await botsApi.stop(bot.id);
      toast.success(`Bot ${bot.displayName} detenido`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleRestart = async (bot: Bot) => {
    try {
      await botsApi.restart(bot.id);
      toast.success(`Bot ${bot.displayName} reiniciado`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (bot: Bot) => {
    if (!confirm(`¿Estás seguro de eliminar el bot "${bot.displayName}"?`)) {
      return;
    }
    try {
      await botsApi.delete(bot.id);
      toast.success(`Bot ${bot.displayName} eliminado`);
      refetch();
    } catch (error: any) {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    }
  };

  const handleCreateBot = () => {
    if (!displayName.trim()) {
      toast.error('El nombre del bot es requerido');
      return;
    }

    if (!name.trim()) {
      toast.error('El identificador interno es requerido');
      return;
    }

    if (!deviceId.trim()) {
      toast.error('El Device ID es requerido');
      return;
    }

    if (!accountId.trim()) {
      toast.error('El Account ID es requerido');
      return;
    }

    if (!secret.trim()) {
      toast.error('El Secret es requerido');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      displayName: displayName.trim(),
      deviceId: deviceId.trim(),
      accountId: accountId.trim(),
      secret: secret.trim(),
      maxGiftsPerDay: parseInt(maxGifts) || 5,
    });
  };

  const stats = {
    total: bots?.length || 0,
    online: bots?.filter((b) => b.status === 'ONLINE').length || 0,
    offline: bots?.filter((b) => b.status === 'OFFLINE').length || 0,
    error: bots?.filter((b) => b.status === 'ERROR').length || 0,
  };

  return (
    <>
      <Header title="Bots" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Online</div>
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Offline</div>
            <div className="text-2xl font-bold text-gray-500">{stats.offline}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Error</div>
            <div className="text-2xl font-bold text-red-500">{stats.error}</div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Gestión de Bots</h2>
            <p className="text-sm text-muted-foreground">
              Administra tus bots de Epic Games
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Bot</DialogTitle>
                <DialogDescription>
                  Configura un nuevo bot de Epic Games para enviar gifts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Identificador Interno</Label>
                  <Input
                    id="name"
                    placeholder="Ej: bot-principal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre único para identificar el bot internamente (sin espacios)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre de Visualización</Label>
                  <Input
                    id="displayName"
                    placeholder="Ej: Bot Principal"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre descriptivo que aparecerá en el dashboard
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input
                    id="deviceId"
                    placeholder="Ej: abc123..."
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único del dispositivo
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    placeholder="Ej: xyz789..."
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador de la cuenta de Epic Games
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret">Secret</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Ej: secret123..."
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Clave secreta de autenticación. Usa{' '}
                    <a
                      href="https://github.com/xMistt/DeviceAuthGenerator"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center"
                    >
                      DeviceAuthGenerator
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    {' '}para obtener estas credenciales
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGifts">Máximo de Gifts por Día</Label>
                  <Input
                    id="maxGifts"
                    type="number"
                    min="1"
                    max="5"
                    value={maxGifts}
                    onChange={(e) => setMaxGifts(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Epic Games limita a 5 gifts por día
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateBot} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Bot'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bots Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Epic Account ID</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>V-Bucks</TableHead>
                <TableHead>Gifts Disponibles</TableHead>
                <TableHead>Gifts Usados Hoy</TableHead>
                <TableHead>Última Actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : bots && bots.length > 0 ? (
                bots.map((bot) => (
                  <TableRow key={bot.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/bots/${bot.id}`)}>
                    <TableCell className="font-medium text-primary">{bot.displayName}</TableCell>
                    <TableCell className="font-mono text-xs">{bot.epicAccountId || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[bot.status]}>
                        {bot.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-purple-600">
                        {bot.vBucks?.toLocaleString() || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={STATUS_COLOR[bot.status]}>
                        {bot.giftsAvailable || 0}
                      </span>
                    </TableCell>
                    <TableCell>{bot.giftsToday || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {bot.lastHeartbeat
                        ? new Date(bot.lastHeartbeat).toLocaleString()
                        : 'Nunca'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No hay bots configurados</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar tu primer bot
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
