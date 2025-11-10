'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodsApi, PaymentMethod } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
  });

  // Fetch payment methods
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentMethodsApi.getAll(false),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<PaymentMethod>) => paymentMethodsApi.create(data),
    onSuccess: () => {
      toast.success('Método de pago creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error al crear: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentMethod> }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      toast.success('Método de pago actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setIsEditDialogOpen(false);
      setSelectedMethod(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.delete(id),
    onSuccess: () => {
      toast.success('Método de pago eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.toggleActive(id),
    onSuccess: () => {
      toast.success('Estado actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar estado: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleCreateClick = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      slug: method.slug,
      description: method.description || '',
      icon: method.icon || '',
      displayOrder: method.displayOrder,
      isActive: method.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod) {
      updateMutation.mutate({
        id: selectedMethod.id,
        data: formData,
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el método de pago "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <Header title="Métodos de Pago" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Métodos de Pago</h2>
            <p className="text-muted-foreground">
              Gestiona los métodos de pago disponibles para los clientes
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Método
          </Button>
        </div>

        {/* Payment Methods List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : methods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">No hay métodos de pago</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crea tu primer método de pago para comenzar
              </p>
              <Button onClick={handleCreateClick}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Método de Pago
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {methods.map((method) => (
              <Card key={method.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{method.name}</CardTitle>
                    <Badge variant={method.isActive ? 'default' : 'secondary'}>
                      {method.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <CardDescription>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {method.slug}
                    </code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {method.description && (
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    )}
                    {method.icon && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Ícono:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {method.icon}
                        </code>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Orden:</span>
                      <Badge variant="outline">{method.displayOrder}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditClick(method)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate(method.id)}
                      >
                        {method.isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(method.id, method.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Crear Método de Pago</DialogTitle>
                <DialogDescription>
                  Completa los datos del nuevo método de pago
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Transferencia Bancaria"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Ej: bank_transfer"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Identificador único (sin espacios, solo letras, números y guiones bajos)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Mercado Pago, Uala, Brubank, etc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Ícono</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Ej: Building2, Wallet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre del ícono de Lucide React
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">Orden de Visualización</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleUpdateSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Método de Pago</DialogTitle>
                <DialogDescription>
                  Modifica los datos del método de pago
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-icon">Ícono</Label>
                  <Input
                    id="edit-icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-displayOrder">Orden de Visualización</Label>
                  <Input
                    id="edit-displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>Activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedMethod(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
