'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi, pricingApi } from '@/lib/api';
import type { CatalogItem, ProductType, CreateCatalogItemRequest, UpdateCatalogItemRequest } from '@/types/api';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Zap,
  RefreshCw,
  Package,
  DollarSign,
  Tag,
  Sparkles,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_TYPES: ProductType[] = [
  'VBUCKS', 'SKIN', 'EMOTE', 'PICKAXE', 'GLIDER', 'BACKPACK', 'WRAP', 'BATTLE_PASS', 'BUNDLE', 'OTHER'
];

const RARITIES = ['COMÚN', 'POCO COMÚN', 'RARA', 'Épico', 'LEGENDARIA', 'MÍTICA'];

export default function CatalogPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [isCustomFilter, setIsCustomFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFlashSaleDialogOpen, setIsFlashSaleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch catalog items
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['catalog', debouncedSearch, typeFilter, rarityFilter, isCustomFilter, isActiveFilter, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params: any = { page: currentPage, limit: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (rarityFilter !== 'all') params.rarity = rarityFilter;
      if (isCustomFilter !== 'all') params.isCustom = isCustomFilter === 'custom';
      if (isActiveFilter !== 'all') params.isActive = isActiveFilter === 'active';
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      const result = await catalogApi.getAll(params);
      setLastUpdated(new Date());
      return result;
    },
  });

  const items = data?.items || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, rarityFilter, isCustomFilter, isActiveFilter, sortBy, sortOrder]);

  // Sync from Fortnite API
  const syncMutation = useMutation({
    mutationFn: catalogApi.syncFromAPI,
    onSuccess: (data) => {
      if (data.message && data.itemCount === 0) {
        toast.warning(data.message);
      } else {
        const newItems = data.newItems || 0;
        const updatedItems = data.updatedItems || 0;
        const deactivatedItems = data.deactivatedItems || 0;
        toast.success(`Sincronizado: ${newItems} nuevos, ${updatedItems} actualizados, ${deactivatedItems} desactivados`);
      }
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (error: any) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });

  // Delete item
  const deleteMutation = useMutation({
    mutationFn: catalogApi.delete,
    onSuccess: () => {
      toast.success('Item eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      catalogApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const handleEdit = (item: CatalogItem) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (item: CatalogItem) => {
    toggleActiveMutation.mutate({ id: item.id, isActive: !item.isActive });
  };

  const handleFlashSale = (item: CatalogItem) => {
    setSelectedItem(item);
    setIsFlashSaleDialogOpen(true);
  };

  const getProductTypeColor = (type: ProductType) => {
    const colors: Record<ProductType, string> = {
      VBUCKS: 'bg-purple-500',
      SKIN: 'bg-blue-500',
      EMOTE: 'bg-green-500',
      PICKAXE: 'bg-yellow-500',
      GLIDER: 'bg-cyan-500',
      BACKPACK: 'bg-orange-500',
      WRAP: 'bg-pink-500',
      BATTLE_PASS: 'bg-indigo-500',
      BUNDLE: 'bg-red-500',
      OTHER: 'bg-gray-500',
    };
    return colors[type];
  };

  const formatPrice = (item: CatalogItem) => {
    if (item.flashSalePrice && item.flashSaleEndsAt && new Date(item.flashSaleEndsAt) > new Date()) {
      return (
        <div className="flex items-center gap-2">
          <span className="line-through text-muted-foreground">
            ${item.basePriceUsd || item.baseVbucks}
          </span>
          <Badge variant="destructive" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            ${item.flashSalePrice}
          </Badge>
        </div>
      );
    }
    return item.basePriceUsd ? `$${item.basePriceUsd}` : `${item.baseVbucks} V-Bucks`;
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded">
          Error al cargar el catálogo: {(error as Error).message}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Catálogo"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="outline"
              size="sm"
              className="h-8 px-2 sm:px-3"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Sincronizar</span>
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="h-8 px-2 sm:px-3">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Nuevo</span>
            </Button>
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:p-6">

      {/* Search Bar */}
      <div className="mb-2 sm:mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, descripción o item ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Item Counter and Last Updated */}
      <div className="flex flex-col gap-1 mb-2 sm:flex-row sm:justify-between sm:items-center sm:mb-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>
            <span className="font-semibold text-foreground">{pagination.total}</span> productos
            {debouncedSearch && <span className="ml-1">- &quot;{debouncedSearch}&quot;</span>}
          </span>
        </div>
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Actualizado: {lastUpdated.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5 mb-3 sm:mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {PRODUCT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Rareza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las rarezas</SelectItem>
            {RARITIES.map(rarity => (
              <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={isCustomFilter} onValueChange={setIsCustomFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo origen</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="api">API</SelectItem>
          </SelectContent>
        </Select>
        <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo estado</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 col-span-2 md:col-span-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 h-9">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="price">Precio</SelectItem>
              <SelectItem value="type">Tipo</SelectItem>
              <SelectItem value="createdAt">Fecha</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="shrink-0 h-9 w-9"
          >
            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando catálogo...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay items en el catálogo</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 bg-card">
              <div className="flex gap-3">
                {/* Image */}
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23374151"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle" dominant-baseline="middle"%3ENo Img%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="h-16 w-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                    No Img
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                          {item.isActive ? (
                            <><PowerOff className="h-4 w-4 mr-2" />Desactivar</>
                          ) : (
                            <><Power className="h-4 w-4 mr-2" />Activar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFlashSale(item)}>
                          <Zap className="h-4 w-4 mr-2" />
                          Flash Sale
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className={`${getProductTypeColor(item.type)} text-[10px]`}>{item.type}</Badge>
                    <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[10px]">
                      {item.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Badge variant={item.isCustom ? 'outline' : 'secondary'} className="text-[10px]">
                      {item.isCustom ? 'Custom' : 'API'}
                    </Badge>
                  </div>
                  {/* Price */}
                  <div className="mt-2 text-sm font-semibold text-primary">
                    {formatPrice(item)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[120px]">Precio</TableHead>
                <TableHead className="w-[80px]">Origen</TableHead>
                <TableHead className="w-[80px]">Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
                <TableHead className="text-right w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando catálogo...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay items en el catálogo
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23374151"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="14" fill="%23fff" text-anchor="middle" dominant-baseline="middle"%3ENo Img%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground">
                          No Img
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getProductTypeColor(item.type)}>{item.type}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(item)}</TableCell>
                    <TableCell>
                      <Badge variant={item.isCustom ? 'default' : 'secondary'} className="text-xs">
                        {item.isCustom ? 'Custom' : 'API'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                        {item.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {item.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                            {item.isActive ? (
                              <><PowerOff className="h-4 w-4 mr-2" />Desactivar</>
                            ) : (
                              <><Power className="h-4 w-4 mr-2" />Activar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFlashSale(item)}>
                            <Zap className="h-4 w-4 mr-2" />
                            Flash Sale
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Página {pagination.page} de {pagination.pages}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">←</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">→</span>
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddItemDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />
      <EditItemDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        item={selectedItem}
      />
      <FlashSaleDialog
        isOpen={isFlashSaleDialogOpen}
        onClose={() => setIsFlashSaleDialogOpen(false)}
        item={selectedItem}
      />
      </div>
    </>
  );
}

// Add Item Dialog Component
function AddItemDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateCatalogItemRequest>({
    name: '',
    description: '',
    type: 'SKIN',
    image: '',
    tags: [],
    isCustom: true,
    isActive: true,
    requiresManualProcess: false,
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.create,
    onSuccess: () => {
      toast.success('Item creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'SKIN',
        image: '',
        tags: [],
        isCustom: true,
        isActive: true,
        requiresManualProcess: false,
      });
    },
    onError: (error: any) => {
      toast.error(`Error al crear: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Item</DialogTitle>
          <DialogDescription>
            Crea un nuevo item para el catálogo de productos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rarity">Rareza</Label>
                <Input
                  id="rarity"
                  value={formData.rarity || ''}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  placeholder="Legendary, Epic, etc."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">URL de Imagen *</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="baseVbucks">V-Bucks</Label>
                <Input
                  id="baseVbucks"
                  type="number"
                  value={formData.baseVbucks || ''}
                  onChange={(e) => setFormData({ ...formData, baseVbucks: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="basePriceUsd">Precio USD</Label>
                <Input
                  id="basePriceUsd"
                  type="number"
                  step="0.01"
                  value={formData.basePriceUsd || ''}
                  onChange={(e) => setFormData({ ...formData, basePriceUsd: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Los campos de margen y descuento se manejan globalmente */}

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (separados por coma)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
                placeholder="popular, nuevo, oferta"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Activo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresManualProcess"
                  checked={formData.requiresManualProcess}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresManualProcess: !!checked })}
                />
                <Label htmlFor="requiresManualProcess">Requiere Proceso Manual</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Item Dialog Component
function EditItemDialog({
  isOpen,
  onClose,
  item
}: {
  isOpen: boolean;
  onClose: () => void;
  item: CatalogItem | null;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateCatalogItemRequest>({});

  // Fetch pricing config
  const { data: pricingConfig } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => pricingApi.getConfig(),
    enabled: isOpen, // Solo cargar cuando el diálogo esté abierto
  });

  // Calcular precio final en tiempo real
  const calculateFinalPrice = () => {
    // SIEMPRE usar el precio calculado del backend si está disponible
    // El backend es la única fuente de verdad para precios
    if (item?.calculatedPrice?.finalPrice) {
      return item.calculatedPrice.finalPrice.toFixed(2);
    }

    // Si no hay precio del backend (item nuevo), calcular manualmente
    // Determinar precio base en USD
    let basePriceUsd = formData.basePriceUsd || item?.basePriceUsd || 0;

    // Si no hay precio USD pero hay V-Bucks, convertir V-Bucks a USD
    if (!basePriceUsd && (formData.baseVbucks || item?.baseVbucks)) {
      const vbucks = formData.baseVbucks || item?.baseVbucks || 0;
      const vbucksToUsdRate = pricingConfig?.vbucksToUsdRate || 0.005;
      basePriceUsd = vbucks * vbucksToUsdRate;
    }

    const margin = formData.profitMargin ?? item?.profitMargin ?? pricingConfig?.defaultProfitMargin ?? 35;
    const discount = formData.discount ?? item?.discount ?? pricingConfig?.defaultDiscount ?? 0;

    // 1. Aplicar margen de ganancia (aumenta el precio)
    const priceWithMargin = basePriceUsd * (1 + margin / 100);

    // 2. Aplicar descuento (reduce el precio)
    const priceAfterDiscount = priceWithMargin * (1 - discount / 100);

    // 3. Aplicar impuesto si está configurado
    let finalPriceUsd = priceAfterDiscount;
    if (pricingConfig?.applyTaxToFinalPrice && pricingConfig?.taxRate) {
      finalPriceUsd = priceAfterDiscount * (1 + pricingConfig.taxRate / 100);
    }

    // 4. Convertir a moneda local
    const usdToLocalRate = pricingConfig?.usdToLocalRate || 1;
    const finalPrice = finalPriceUsd * usdToLocalRate;

    return finalPrice.toFixed(2);
  };

  // Update form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        type: item.type,
        rarity: item.rarity,
        image: item.image,
        baseVbucks: item.baseVbucks,
        basePriceUsd: item.basePriceUsd,
        profitMargin: item.profitMargin ?? undefined, // Use undefined para que muestre el valor global
        discount: item.discount ?? undefined, // Use undefined para que muestre el valor global
        isActive: item.isActive,
        requiresManualProcess: item.requiresManualProcess,
        tags: item.tags,
      });
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCatalogItemRequest }) =>
      catalogApi.update(id, data),
    onSuccess: () => {
      toast.success('Item actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      // Filtrar campos vacíos o null para evitar errores de validación
      const cleanedData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key as keyof UpdateCatalogItemRequest] = value;
        }
        return acc;
      }, {} as UpdateCatalogItemRequest);

      updateMutation.mutate({ id: item.id, data: cleanedData });
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
          <DialogDescription>
            Modifica los detalles del item del catálogo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-rarity">Rareza</Label>
                <Input
                  id="edit-rarity"
                  value={formData.rarity || ''}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                  placeholder="Legendary, Epic, etc."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-image">URL de Imagen</Label>
              <Input
                id="edit-image"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-24 w-24 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-baseVbucks">V-Bucks</Label>
                <Input
                  id="edit-baseVbucks"
                  type="number"
                  value={formData.baseVbucks || ''}
                  onChange={(e) => setFormData({ ...formData, baseVbucks: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-basePriceUsd">Precio USD</Label>
                <Input
                  id="edit-basePriceUsd"
                  type="number"
                  step="0.01"
                  value={formData.basePriceUsd || ''}
                  onChange={(e) => setFormData({ ...formData, basePriceUsd: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Campos de margen y descuento ocultos - se usan valores globales */}
            <div className="grid gap-2 bg-muted/50 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Configuración de Precios</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se están usando los valores globales de la configuración de precios
                  </p>
                </div>
                <Link href="/pricing" className="text-xs text-primary hover:underline">
                  Editar configuración global →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Margen de Ganancia:</span>
                  <span className="ml-2 font-medium">{pricingConfig?.defaultProfitMargin ?? 30}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Descuento:</span>
                  <span className="ml-2 font-medium">{pricingConfig?.defaultDiscount ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* Precio calculado */}
            <div className="grid gap-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-base font-semibold">Precio Final Calculado</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este es el precio que verán los clientes en la tienda
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {pricingConfig?.currencySymbol || '$'}{calculateFinalPrice()}
                  </p>
                  {(formData.baseVbucks || item?.baseVbucks) && !formData.basePriceUsd && !item?.basePriceUsd && (
                    <p className="text-xs text-muted-foreground">
                      {formData.baseVbucks || item?.baseVbucks} V-Bucks → ${((formData.baseVbucks || item?.baseVbucks || 0) * (pricingConfig?.vbucksToUsdRate || 0.005)).toFixed(2)} USD
                    </p>
                  )}
                  {(formData.basePriceUsd || item?.basePriceUsd) && (
                    <p className="text-xs text-muted-foreground">
                      Precio base: ${(formData.basePriceUsd || item?.basePriceUsd)?.toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
              {pricingConfig && (
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  <p className="font-medium mb-1">Desglose del cálculo:</p>
                  <ul className="space-y-0.5 pl-4">
                    {(formData.baseVbucks || item?.baseVbucks) && !formData.basePriceUsd && !item?.basePriceUsd ? (
                      <li>• Base: {formData.baseVbucks || item?.baseVbucks} V-Bucks (${((formData.baseVbucks || item?.baseVbucks || 0) * (pricingConfig.vbucksToUsdRate || 0.005)).toFixed(2)} USD @ {pricingConfig.vbucksToUsdRate} USD/V-Buck)</li>
                    ) : (
                      <li>• Base: ${(formData.basePriceUsd || item?.basePriceUsd || 0).toFixed(2)} USD</li>
                    )}
                    <li>• + Margen: {formData.profitMargin ?? item?.profitMargin ?? pricingConfig.defaultProfitMargin ?? 30}%</li>
                    <li>• - Descuento: {formData.discount ?? item?.discount ?? pricingConfig.defaultDiscount ?? 0}%</li>
                    {pricingConfig.applyTaxToFinalPrice && pricingConfig.taxRate > 0 && (
                      <li>• + Impuesto: {pricingConfig.taxRate}%</li>
                    )}
                    {pricingConfig.usdToLocalRate !== 1 && (
                      <li>• × Tasa de cambio: {pricingConfig.usdToLocalRate} {pricingConfig.currencyCode}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tags">Tags (separados por coma)</Label>
              <Input
                id="edit-tags"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
                placeholder="popular, nuevo, oferta"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="edit-isActive">Activo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-requiresManualProcess"
                  checked={formData.requiresManualProcess}
                  onCheckedChange={(checked) => setFormData({ ...formData, requiresManualProcess: !!checked })}
                />
                <Label htmlFor="edit-requiresManualProcess">Requiere Proceso Manual</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Flash Sale Dialog Component
function FlashSaleDialog({
  isOpen,
  onClose,
  item
}: {
  isOpen: boolean;
  onClose: () => void;
  item: CatalogItem | null;
}) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const flashSaleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { price: number; endsAt: string } }) =>
      catalogApi.createFlashSale(id, data),
    onSuccess: () => {
      toast.success('Flash sale creada correctamente');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
      setPrice('');
      setEndsAt('');
    },
    onError: (error: any) => {
      toast.error(`Error al crear flash sale: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      flashSaleMutation.mutate({
        id: item.id,
        data: { price: Number(price), endsAt }
      });
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Crear Flash Sale
          </DialogTitle>
          <DialogDescription>
            Configura una oferta temporal para {item.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="flash-price">Precio de Oferta ($)</Label>
              <Input
                id="flash-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19.99"
                required
              />
              <p className="text-sm text-muted-foreground">
                Precio original: ${item.basePriceUsd || item.baseVbucks}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="flash-endsAt">Finaliza el</Label>
              <Input
                id="flash-endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={flashSaleMutation.isPending}>
              {flashSaleMutation.isPending ? 'Creando...' : 'Crear Flash Sale'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
