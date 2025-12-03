'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, User, InviteUserRequest } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  UserPlus,
  Loader2,
  Users,
  RefreshCw,
  Shield,
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Trash2,
  Send,
  UserCog,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-neon-red/20 text-neon-red border-neon-red/30',
  ADMIN: 'bg-primary/20 text-primary border-primary/30',
  OPERATOR: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
  VIEWER: 'bg-muted text-muted-foreground border-muted',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATOR: 'Operador',
  VIEWER: 'Viewer',
};

const formatDate = (date: string | null) => {
  if (!date) return 'Nunca';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteUserRequest>({
    username: '',
    email: '',
    role: 'OPERATOR',
    phoneNumber: '',
  });

  // Copy state
  const [copied, setCopied] = useState(false);

  // Query para usuarios
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (data: InviteUserRequest) => usersApi.invite(data),
    onSuccess: (result) => {
      const activateUrl = `${window.location.origin}/activate/${result.invitationToken}`;
      setInviteSuccess(activateUrl);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario invitado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al invitar usuario');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar usuario');
    },
  });

  const resendMutation = useMutation({
    mutationFn: (userId: string) => usersApi.resendInvitation(userId),
    onSuccess: (result) => {
      toast.success(`Invitación reenviada exitosamente.\n\nURL: ${result.inviteUrl}`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al reenviar invitación');
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    deleteMutation.mutate(userId);
  };

  const handleResendInvitation = async (userId: string) => {
    resendMutation.mutate(userId);
  };

  const resetInviteForm = () => {
    setInviteForm({
      username: '',
      email: '',
      role: 'OPERATOR',
      phoneNumber: '',
    });
    setInviteSuccess(null);
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
    operators: users.filter((u) => u.role === 'OPERATOR').length,
  };

  return (
    <>
      <Header title="Admin Users" />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-xl font-bold sm:text-2xl">{stats.total}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Activos</span>
            </div>
            <div className="text-xl font-bold text-green-500 sm:text-2xl">{stats.active}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Inactivos</span>
            </div>
            <div className="text-xl font-bold text-yellow-500 sm:text-2xl">{stats.inactive}</div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Admins</span>
            </div>
            <div className="text-xl font-bold text-purple-500 sm:text-2xl">{stats.admins}</div>
          </Card>
          <Card className="p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-500" />
              <span className="text-xs sm:text-sm text-muted-foreground">Operadores</span>
            </div>
            <div className="text-xl font-bold text-cyan-500 sm:text-2xl">{stats.operators}</div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Dialog
            open={inviteOpen}
            onOpenChange={(open) => {
              setInviteOpen(open);
              if (!open) resetInviteForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Invitar Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  El usuario recibirá un enlace por WhatsApp para activar su cuenta.
                </DialogDescription>
              </DialogHeader>

              {inviteSuccess ? (
                <div className="space-y-4 py-4">
                  <Alert className="border-neon-green/30 bg-neon-green/10">
                    <Check className="h-4 w-4 text-neon-green" />
                    <AlertDescription className="text-neon-green">
                      Usuario invitado exitosamente
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>Enlace de activación:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={inviteSuccess}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(inviteSuccess)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-neon-green" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este enlace también fue enviado al WhatsApp del usuario.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setInviteOpen(false);
                        resetInviteForm();
                      }}
                    >
                      Cerrar
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <form onSubmit={handleInvite}>
                  <div className="space-y-4 py-4">
                    {inviteMutation.isError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {(inviteMutation.error as any)?.message || 'Error al invitar usuario'}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="username">Usuario *</Label>
                      <Input
                        id="username"
                        value={inviteForm.username}
                        onChange={(e) =>
                          setInviteForm((prev) => ({ ...prev, username: e.target.value }))
                        }
                        placeholder="nombre_usuario"
                        required
                        disabled={inviteMutation.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) =>
                          setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="usuario@ejemplo.com"
                        disabled={inviteMutation.isPending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">WhatsApp *</Label>
                      <Input
                        id="phoneNumber"
                        value={inviteForm.phoneNumber}
                        onChange={(e) =>
                          setInviteForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                        }
                        placeholder="573001234567"
                        required
                        disabled={inviteMutation.isPending}
                      />
                      <p className="text-xs text-muted-foreground">
                        Incluye el código de país sin el +
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Rol *</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(value) =>
                          setInviteForm((prev) => ({ ...prev, role: value as any }))
                        }
                        disabled={inviteMutation.isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="OPERATOR">Operador</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInviteOpen(false)}
                      disabled={inviteMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={inviteMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {inviteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Invitando...
                        </>
                      ) : (
                        'Invitar'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{(error as any)?.message || 'Error al cargar usuarios'}</AlertDescription>
          </Alert>
        )}

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Usuario</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[150px]">Email</TableHead>
                  <TableHead className="min-w-[100px]">Rol</TableHead>
                  <TableHead className="min-w-[80px]">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[140px]">Último Login</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No hay usuarios registrados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.username}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {user.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${roleColors[user.role]} text-[10px] sm:text-xs whitespace-nowrap`}
                        >
                          <span className="hidden sm:inline">
                            {user.role === 'SUPER_ADMIN' && (
                              <ShieldCheck className="mr-1 h-3 w-3 inline" />
                            )}
                            {user.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3 inline" />}
                            {user.role === 'VIEWER' && <Eye className="mr-1 h-3 w-3 inline" />}
                          </span>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs ${
                            user.isActive
                              ? 'bg-neon-green/20 text-neon-green border-neon-green/30'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs sm:text-sm">
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!user.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10"
                              onClick={() => handleResendInvitation(user.id)}
                              title="Reenviar invitación"
                              disabled={resendMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== 'SUPER_ADMIN' && user.username !== 'store-client' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neon-red hover:text-neon-red hover:bg-neon-red/10"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </>
  );
}
