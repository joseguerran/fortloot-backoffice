'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest, catalogApi } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Megaphone,
  AlertTriangle,
  Gift,
  Power,
  Pencil,
  Trash2,
  Calendar,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const TYPE_CONFIG = {
  MAINTENANCE: {
    label: 'Mantenimiento',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
  },
  PROMOTION: {
    label: 'Promocion',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    icon: Gift,
  },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

type FormData = {
  type: 'MAINTENANCE' | 'PROMOTION';
  title: string;
  message: string;
  imageUrl: string;
  productId: string;
  linkUrl: string;
  linkText: string;
  isActive: boolean;
  priority: number;
  startsAt: string;
  endsAt: string;
};

const emptyFormData: FormData = {
  type: 'PROMOTION',
  title: '',
  message: '',
  imageUrl: '',
  productId: '',
  linkUrl: '',
  linkText: '',
  isActive: false,
  priority: 0,
  startsAt: '',
  endsAt: '',
};

export default function AnnouncementsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Query: Get all announcements
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements', typeFilter, statusFilter],
    queryFn: () =>
      announcementsApi.getAll({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }),
  });

  // Query: Get catalog items for product selection
  const { data: catalogData } = useQuery({
    queryKey: ['catalog-items-for-announcements'],
    queryFn: () => catalogApi.getAll({ isActive: true, limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => announcementsApi.create(data),
    onSuccess: () => {
      toast.success('Anuncio creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequest }) =>
      announcementsApi.update(id, data),
    onSuccess: () => {
      toast.success('Anuncio actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.toggle(id),
    onSuccess: (data) => {
      toast.success(`Anuncio ${data.isActive ? 'activado' : 'desactivado'}`);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => {
      toast.success('Anuncio eliminado');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDeleteDialogOpen(false);
      setDeletingAnnouncement(null);
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      type: announcement.type,
      title: announcement.title || '',
      message: announcement.message || '',
      imageUrl: announcement.imageUrl || '',
      productId: announcement.productId || '',
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
      isActive: announcement.isActive,
      priority: announcement.priority,
      startsAt: announcement.startsAt ? announcement.startsAt.substring(0, 16) : '',
      endsAt: announcement.endsAt ? announcement.endsAt.substring(0, 16) : '',
    });
    setDialogOpen(true);
  };

  const handleClone = (announcement: Announcement) => {
    setEditingId(null); // No ID means create new
    setFormData({
      type: announcement.type,
      title: announcement.title ? `${announcement.title} (copia)` : '',
      message: announcement.message || '',
      imageUrl: announcement.imageUrl || '',
      productId: announcement.productId || '',
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
      isActive: false, // Start as inactive
      priority: announcement.priority,
      startsAt: '', // Clear dates for the clone
      endsAt: '',
    });
    setDialogOpen(true);
    toast.info('Clonando anuncio - modifica y guarda para crear una copia');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = () => {
    // When editing, empty strings should become null to clear the field
    // When creating, empty strings should become undefined to use defaults
    const isEditing = !!editingId;

    const payload: CreateAnnouncementRequest | UpdateAnnouncementRequest = {
      type: formData.type,
      title: formData.title.trim() || (isEditing ? null : undefined),
      message: formData.message.trim() || (isEditing ? null : undefined),
      imageUrl: formData.imageUrl.trim() || (isEditing ? null : undefined),
      productId: formData.productId && formData.productId !== 'none' ? formData.productId : (isEditing ? null : undefined),
      linkUrl: formData.linkUrl.trim() || (isEditing ? null : undefined),
      linkText: formData.linkText.trim() || (isEditing ? null : undefined),
      isActive: formData.isActive,
      priority: formData.priority,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : (isEditing ? null : undefined),
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : (isEditing ? null : undefined),
    };

    if (isEditing) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload as CreateAnnouncementRequest);
    }
  };

  const handleOpenDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingAnnouncement) {
      deleteMutation.mutate(deletingAnnouncement.id);
    }
  };

  // Image upload handler
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await announcementsApi.uploadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(`Error al subir imagen: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  }, []);

  // Stats
  const stats = {
    total: announcements?.length || 0,
    maintenance: announcements?.filter((a) => a.type === 'MAINTENANCE').length || 0,
    promotion: announcements?.filter((a) => a.type === 'PROMOTION').length || 0,
    active: announcements?.filter((a) => a.isActive).length || 0,
  };

  return (
    <>
      <Header title="Anuncios" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Mantenimiento</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">{stats.maintenance}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Promocion</span>
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.promotion}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Activos</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                <SelectItem value="PROMOTION">Promocion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Anuncio
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Titulo</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Programacion</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : announcements && announcements.length > 0 ? (
                announcements.map((announcement) => {
                  const TypeIcon = TYPE_CONFIG[announcement.type].icon;
                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${TYPE_CONFIG[announcement.type].color} ${TYPE_CONFIG[announcement.type].bgColor}`}
                        >
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {TYPE_CONFIG[announcement.type].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {announcement.title}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {announcement.message}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {announcement.startsAt || announcement.endsAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(announcement.startsAt)} - {formatDate(announcement.endsAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin programar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {announcement.isActive ? (
                          <Badge variant="default" className="bg-green-500">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactivo
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
                            <DropdownMenuItem onClick={() => handleOpenEdit(announcement)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(announcement)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clonar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleMutation.mutate(announcement.id)}>
                              <Power className="h-4 w-4 mr-2" />
                              {announcement.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDelete(announcement)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay anuncios</p>
                      <Button variant="outline" size="sm" onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primer anuncio
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Dialog: Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </DialogTitle>
            <DialogDescription>
              {formData.type === 'MAINTENANCE'
                ? 'Los anuncios de mantenimiento bloquean las compras mientras estan activos.'
                : 'Los anuncios de promocion se muestran como banners en la tienda.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo de anuncio</Label>
              <Select
                value={formData.type}
                onValueChange={(v: 'MAINTENANCE' | 'PROMOTION') =>
                  setFormData((prev) => ({ ...prev, type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAINTENANCE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Mantenimiento
                    </div>
                  </SelectItem>
                  <SelectItem value="PROMOTION">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-blue-500" />
                      Promocion
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo (opcional)</Label>
              <Input
                id="title"
                placeholder="Ej: Mantenimiento programado"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Ej: Estamos realizando mejoras en nuestro sistema..."
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Promotion-only fields */}
            {formData.type === 'PROMOTION' && (
              <>
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" />
                      Imagen del banner (opcional)
                    </div>
                  </Label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {formData.imageUrl ? (
                    // Show uploaded image preview
                    <div className="relative rounded-lg border border-border overflow-hidden">
                      <div className="relative h-40 w-full bg-muted">
                        <Image
                          src={formData.imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleRemoveImage}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Show upload button
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer transition-colors bg-muted/50"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                          <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Haz clic para subir una imagen</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG o GIF (max. 5MB)</p>
                          <p className="text-xs text-blue-500 mt-2 font-medium">Dimensiones recomendadas: 1920 x 400 px</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Product */}
                <div className="space-y-2">
                  <Label>Producto relacionado (opcional)</Label>
                  <Select
                    value={formData.productId || 'none'}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, productId: v === 'none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {catalogData?.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Link */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">
                      <div className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        URL del link (opcional)
                      </div>
                    </Label>
                    <Input
                      id="linkUrl"
                      placeholder="https://..."
                      value={formData.linkUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkText">Texto del link</Label>
                    <Input
                      id="linkText"
                      placeholder="Ej: Ver oferta"
                      value={formData.linkText}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkText: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Inicio (opcional)
                  </div>
                </Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">Fin (opcional)</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endsAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Priority & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">Mayor numero = mayor prioridad</p>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <span className="text-sm">
                    {formData.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : editingId
                ? 'Actualizar'
                : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Anuncio</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de eliminar el anuncio &quot;{deletingAnnouncement?.title}&quot;?
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
