'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi, Customer } from '@/lib/api';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  Search,
  Ban,
  ShieldCheck,
  Crown,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

const TIER_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  REGULAR: 'secondary',
  VIP: 'default',
  PREMIUM: 'default',
};

const TIER_COLORS: Record<string, string> = {
  REGULAR: 'text-gray-500',
  VIP: 'text-yellow-500',
  PREMIUM: 'text-purple-500',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default function CustomersPage() {
  // State para filtros
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // State para dialogs
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [newTier, setNewTier] = useState<'REGULAR' | 'VIP' | 'PREMIUM'>('REGULAR');

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query para listar customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, debouncedSearch, tierFilter, statusFilter],
    queryFn: () =>
      customersApi.getAll({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        isBlacklisted:
          statusFilter === 'blacklisted'
            ? true
            : statusFilter === 'active'
            ? false
            : undefined,
      }),
  });

  // Mutations
  const changeTierMutation = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: 'REGULAR' | 'VIP' | 'PREMIUM' }) =>
      customersApi.changeTier(id, tier),
    onSuccess: () => {
      toast.success('Tier actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setTierDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      customersApi.addToBlacklist(id, reason),
    onSuccess: () => {
      toast.success('Cliente agregado a blacklist');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setBlacklistDialogOpen(false);
      setSelectedCustomer(null);
      setBlacklistReason('');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    },
  });

  const unblacklistMutation = useMutation({
    mutationFn: (id: string) => customersApi.removeFromBlacklist(id),
    onSuccess: () => {
      toast.success('Cliente removido de blacklist');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    },
  });

  // Handlers
  const handleOpenTierDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewTier(customer.tier);
    setTierDialogOpen(true);
  };

  const handleChangeTier = () => {
    if (selectedCustomer) {
      changeTierMutation.mutate({ id: selectedCustomer.id, tier: newTier });
    }
  };

  const handleOpenBlacklistDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setBlacklistReason('');
    setBlacklistDialogOpen(true);
  };

  const handleBlacklist = () => {
    if (selectedCustomer && blacklistReason.trim()) {
      blacklistMutation.mutate({ id: selectedCustomer.id, reason: blacklistReason.trim() });
    }
  };

  const handleUnblacklist = (customer: Customer) => {
    if (confirm(`¿Remover a "${customer.displayName}" de la blacklist?`)) {
      unblacklistMutation.mutate(customer.id);
    }
  };

  // Calculate stats
  const stats = {
    total: data?.pagination.total || 0,
    regular: data?.customers.filter((c) => c.tier === 'REGULAR').length || 0,
    vip: data?.customers.filter((c) => c.tier === 'VIP').length || 0,
    premium: data?.customers.filter((c) => c.tier === 'PREMIUM').length || 0,
    blacklisted: data?.customers.filter((c) => c.isBlacklisted).length || 0,
  };

  return (
    <>
      <Header title="Clientes" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">Regular</span>
            </div>
            <div className="text-2xl font-bold text-gray-500">{stats.regular}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">VIP</span>
            </div>
            <div className="text-2xl font-bold text-yellow-500">{stats.vip}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Premium</span>
            </div>
            <div className="text-2xl font-bold text-purple-500">{stats.premium}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Blacklisted</span>
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.blacklisted}</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, Epic ID o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tiers</SelectItem>
              <SelectItem value="REGULAR">Regular</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="PREMIUM">Premium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="blacklisted">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Epic ID</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Órdenes</TableHead>
                <TableHead className="text-right">Total Gastado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : data?.customers && data.customers.length > 0 ? (
                data.customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.displayName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {customer.epicAccountId ? customer.epicAccountId.substring(0, 12) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {customer.contactPreference === 'EMAIL' ? (
                          <>
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{customer.email || '-'}</span>
                          </>
                        ) : (
                          <>
                            <Phone className="h-3 w-3" />
                            <span>{customer.phoneNumber || '-'}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIER_BADGE_VARIANT[customer.tier]} className={TIER_COLORS[customer.tier]}>
                        {customer.tier === 'REGULAR' && <User className="h-3 w-3 mr-1" />}
                        {(customer.tier === 'VIP' || customer.tier === 'PREMIUM') && <Crown className="h-3 w-3 mr-1" />}
                        {customer.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{customer.totalOrders}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell>
                      {customer.isBlacklisted ? (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Blacklisted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenTierDialog(customer)}>
                            <Crown className="h-4 w-4 mr-2" />
                            Cambiar Tier
                          </DropdownMenuItem>
                          {customer.isBlacklisted ? (
                            <DropdownMenuItem
                              onClick={() => handleUnblacklist(customer)}
                              className="text-green-600"
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Quitar de Blacklist
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleOpenBlacklistDialog(customer)}
                              className="text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Agregar a Blacklist
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No se encontraron clientes</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * 20) + 1} - {Math.min(page * 20, data.pagination.total)} de {data.pagination.total} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {data.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={page === data.pagination.pages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Cambiar Tier */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Tier</DialogTitle>
            <DialogDescription>
              Cambiar el tier de <strong>{selectedCustomer?.displayName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nuevo Tier</Label>
              <Select value={newTier} onValueChange={(v: 'REGULAR' | 'VIP' | 'PREMIUM') => setNewTier(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Regular
                    </div>
                  </SelectItem>
                  <SelectItem value="VIP">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      VIP
                    </div>
                  </SelectItem>
                  <SelectItem value="PREMIUM">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      Premium
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeTier} disabled={changeTierMutation.isPending}>
              {changeTierMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Blacklist */}
      <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a Blacklist</DialogTitle>
            <DialogDescription>
              Agregar a <strong>{selectedCustomer?.displayName}</strong> a la blacklist.
              Este cliente no podrá realizar compras.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del bloqueo</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Fraude, comportamiento abusivo, etc."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlacklist}
              disabled={!blacklistReason.trim() || blacklistMutation.isPending}
            >
              {blacklistMutation.isPending ? 'Bloqueando...' : 'Bloquear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
