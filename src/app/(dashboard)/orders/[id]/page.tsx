'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { Header } from '@/components/dashboard/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, XCircle, RotateCw, User, Package, DollarSign, Calendar, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Receipt, FileText, Bitcoin, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { POLLING_INTERVALS } from '@/lib/constants';

const CRYPTO_STATUS_CONFIG: Record<string, { label: string; color: string; badgeVariant: string }> = {
  PENDING: { label: 'Esperando Pago', color: 'text-yellow-500', badgeVariant: 'secondary' },
  CONFIRMING: { label: 'Confirmando', color: 'text-blue-500', badgeVariant: 'default' },
  PAID: { label: 'Pagado', color: 'text-green-500', badgeVariant: 'default' },
  PAID_OVER: { label: 'Pagado (exceso)', color: 'text-green-500', badgeVariant: 'default' },
  WRONG_AMOUNT: { label: 'Monto Incorrecto', color: 'text-red-500', badgeVariant: 'destructive' },
  EXPIRED: { label: 'Expirado', color: 'text-gray-500', badgeVariant: 'secondary' },
  CANCELLED: { label: 'Cancelado', color: 'text-gray-500', badgeVariant: 'secondary' },
  FAILED: { label: 'Fallido', color: 'text-red-500', badgeVariant: 'destructive' },
};

const STATUS_BADGE_VARIANT: Record<string, any> = {
  PENDING: 'secondary',
  PENDING_PAYMENT: 'secondary',
  PAYMENT_UPLOADED: 'default',
  PAYMENT_VERIFIED: 'default',
  PAYMENT_REJECTED: 'destructive',
  EXPIRED: 'secondary',
  WAITING_FRIENDSHIP: 'default',
  WAITING_PERIOD: 'default',
  WAITING_VBUCKS: 'destructive',
  WAITING_BOT_FIX: 'destructive',
  WAITING_BOT: 'default',
  QUEUED: 'default',
  PROCESSING: 'default',
  COMPLETED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
  REFUNDED: 'secondary',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-500',
  PENDING_PAYMENT: 'text-yellow-500',
  PAYMENT_UPLOADED: 'text-blue-500',
  PAYMENT_VERIFIED: 'text-green-500',
  PAYMENT_REJECTED: 'text-red-500',
  EXPIRED: 'text-gray-500',
  WAITING_FRIENDSHIP: 'text-blue-500',
  WAITING_PERIOD: 'text-blue-500',
  WAITING_VBUCKS: 'text-orange-500',
  WAITING_BOT_FIX: 'text-orange-500',
  WAITING_BOT: 'text-yellow-500',
  QUEUED: 'text-blue-500',
  PROCESSING: 'text-blue-500',
  COMPLETED: 'text-green-500',
  FAILED: 'text-red-500',
  CANCELLED: 'text-gray-500',
  REFUNDED: 'text-gray-500',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOne(orderId),
    refetchInterval: POLLING_INTERVALS.ORDER_DETAIL,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => ordersApi.retry(orderId),
    onSuccess: () => {
      toast.success('Order retry initiated successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to retry order');
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => ordersApi.approve(orderId),
    onSuccess: () => {
      toast.success('Order payment approved successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve order');
    },
  });

  const markVBucksLoadedMutation = useMutation({
    mutationFn: () => ordersApi.markVBucksLoaded(orderId),
    onSuccess: () => {
      toast.success('✅ V-Bucks marked as loaded. Order requeued for processing.');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark V-Bucks as loaded');
    },
  });

  const markBotFixedMutation = useMutation({
    mutationFn: () => ordersApi.markBotFixed(orderId),
    onSuccess: () => {
      toast.success('✅ Bot marked as fixed. Order requeued for processing.');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark bot as fixed');
    },
  });

  if (isLoading) {
    return (
      <>
        <Header title="Order Details" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header title="Order Details" />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push('/orders')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const canCancel = !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status);
  const canRetry = order.status === 'FAILED';
  const canApprove = order.status === 'PAYMENT_UPLOADED';
  const canMarkVBucksLoaded = order.status === 'WAITING_VBUCKS';
  const canMarkBotFixed = order.status === 'WAITING_BOT_FIX';

  return (
    <>
      <Header title="Order Details" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div className="flex gap-2">
            {canApprove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Payment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will verify the payment and move the order to the processing queue. Make sure you have verified the payment proof before approving.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => approveMutation.mutate()}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Yes, approve payment
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canRetry && (
              <Button
                variant="outline"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            {canMarkVBucksLoaded && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Mark V-Bucks Loaded
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark V-Bucks as Loaded?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark that you have loaded V-Bucks to the bot and requeue the order for processing. Make sure the bot has sufficient V-Bucks before confirming.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => markVBucksLoadedMutation.mutate()}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Yes, V-Bucks loaded
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canMarkBotFixed && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Bot Fixed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Bot as Fixed?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark that you have fixed the bot credentials and requeue the order for processing. Make sure the bot is online and authenticated before confirming.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => markBotFixedMutation.mutate()}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                    >
                      Yes, bot is fixed
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently cancel the order.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>No, keep it</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, cancel order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Order Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
              <p className="text-muted-foreground text-sm">
                Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[order.status]} className="text-lg px-4 py-2">
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>

          {order.failureReason && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive">Failure Reason</p>
                  <p className="text-sm text-destructive/80">{order.failureReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Step Display */}
          {(order as any).currentStep && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Current Step</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{(order as any).currentStep}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Main Layout: 2 columns for content + 1 column for timeline */}
        <div className="grid gap-4 lg:grid-cols-3 grid-cols-1">
          {/* Left Side - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Top row: Customer, Product, Pricing, Dates */}
            <div className="grid gap-4 md:grid-cols-2 grid-cols-1">
              {/* Customer Info */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{order.customer?.displayName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Epic ID</p>
                    <p className="font-mono text-sm">{order.customer?.epicAccountId || 'N/A'}</p>
                  </div>
                  {order.customer?.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm">{order.customer.email}</p>
                    </div>
                  )}
                  {order.customer?.phoneNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="text-sm">{order.customer.phoneNumber}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Product Info */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Product Information</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{order.orderItems?.[0]?.productName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline">{order.orderItems?.[0]?.productType || 'N/A'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{order.orderItems?.[0]?.quantity || 1}</p>
                  </div>
                </div>
              </Card>

              {/* Pricing Info */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Pricing</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="font-medium">${order.basePrice?.toFixed(2) || '0.00'}</p>
                  </div>
                  {(order.discountAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <p className="text-sm">Discount</p>
                      <p className="font-medium">-${order.discountAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <p className="font-semibold">Total</p>
                    <p className="font-semibold text-lg">${order.finalPrice?.toFixed(2) || '0.00'} {order.currency}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={order.priority === 'VIP' ? 'default' : 'outline'}>
                      {order.priority}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Timeline</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">{format(new Date(order.createdAt), 'PPpp')}</p>
                  </div>
                  {order.updatedAt && order.updatedAt !== order.createdAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm">{format(new Date(order.updatedAt), 'PPpp')}</p>
                    </div>
                  )}
                  {order.completedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-sm">{format(new Date(order.completedAt), 'PPpp')}</p>
                    </div>
                  )}
                  {order.estimatedDelivery && !order.completedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                      <p className="text-sm">{format(new Date(order.estimatedDelivery), 'PPpp')}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Bot Assignment (if assigned) */}
            {order.assignedBotId && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Bot Assignment</h3>
                <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Bot ID</p>
                    <p className="font-mono text-sm">{order.assignedBotId}</p>
                  </div>
                  {order.assignedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned At</p>
                      <p className="text-sm">{format(new Date(order.assignedAt), 'PPpp')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Attempts</p>
                    <p className="text-sm">{order.attempts} / {order.maxAttempts}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Order Items (if available) */}
            {order.orderItems && order.orderItems.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.orderItems.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex justify-between items-start p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">Type: {item.productType}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(item.finalPrice * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">${item.finalPrice.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment Proof (if available) */}
            {(order as any).paymentProofUrl && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Comprobante de Pago</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
                    {order.paymentMethod && (
                      <div>
                        <p className="text-sm text-muted-foreground">Método de Pago</p>
                        <p className="font-medium">{order.paymentMethod}</p>
                      </div>
                    )}
                    {(order as any).transactionId && (
                      <div>
                        <p className="text-sm text-muted-foreground">ID de Transacción</p>
                        <p className="font-mono text-sm">{(order as any).transactionId}</p>
                      </div>
                    )}
                    {(order as any).paymentUploadedAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Subido</p>
                        <p className="text-sm">{format(new Date((order as any).paymentUploadedAt), 'PPpp')}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">Imagen del Comprobante</p>
                    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/20">
                      {/* Icono de recibo */}
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>

                      {/* Información del comprobante */}
                      <div className="text-center space-y-1">
                        <p className="font-medium">Comprobante Subido</p>
                        {(order as any).paymentUploadedAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date((order as any).paymentUploadedAt), 'PPp')}
                          </p>
                        )}
                      </div>

                      {/* Botón para ver comprobante */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${(order as any).paymentProofUrl}`, '_blank')}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Comprobante
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Crypto Payment Info (if CRYPTO payment) */}
            {order.paymentMethod === 'CRYPTO' && (order as any).cryptoPayment && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bitcoin className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Pago con Crypto</h3>
                </div>
                <div className="space-y-4">
                  {/* Crypto Status Badge */}
                  {(() => {
                    const cryptoPayment = (order as any).cryptoPayment;
                    const cryptoConfig = CRYPTO_STATUS_CONFIG[cryptoPayment.status] || CRYPTO_STATUS_CONFIG.PENDING;
                    return (
                      <div className="flex items-center gap-4">
                        <Badge variant={cryptoConfig.badgeVariant as any} className="text-sm">
                          {cryptoConfig.label}
                        </Badge>
                        {cryptoPayment.cryptomusInvoiceId && (
                          <span className="text-xs text-muted-foreground font-mono">
                            ID: {cryptoPayment.cryptomusInvoiceId}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Payment Details Grid */}
                  <div className="grid gap-4 md:grid-cols-3 grid-cols-1">
                    {(order as any).cryptoPayment.cryptoCurrency && (
                      <div>
                        <p className="text-sm text-muted-foreground">Moneda</p>
                        <p className="font-medium">{(order as any).cryptoPayment.cryptoCurrency}</p>
                      </div>
                    )}
                    {(order as any).cryptoPayment.network && (
                      <div>
                        <p className="text-sm text-muted-foreground">Red</p>
                        <p className="font-medium">{(order as any).cryptoPayment.network}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Monto</p>
                      <p className="font-medium">${(order as any).cryptoPayment.amount?.toFixed(2) || '0.00'} USD</p>
                    </div>
                    {(order as any).cryptoPayment.paidAmount !== null && (order as any).cryptoPayment.paidAmount !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Pagado</p>
                        <p className="font-medium text-green-600">${(order as any).cryptoPayment.paidAmount?.toFixed(2) || '0.00'} USD</p>
                      </div>
                    )}
                    {(order as any).cryptoPayment.expiresAt && (order as any).cryptoPayment.status === 'PENDING' && (
                      <div>
                        <p className="text-sm text-muted-foreground">Expira</p>
                        <p className="font-medium text-yellow-600">
                          {format(new Date((order as any).cryptoPayment.expiresAt), 'PPpp')}
                        </p>
                      </div>
                    )}
                    {(order as any).cryptoPayment.paidAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de Pago</p>
                        <p className="font-medium text-green-600">
                          {format(new Date((order as any).cryptoPayment.paidAt), 'PPpp')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Transaction Hash */}
                  {(order as any).cryptoPayment.txHash && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hash de Transaccion</p>
                      <p className="font-mono text-xs p-2 bg-muted rounded break-all">
                        {(order as any).cryptoPayment.txHash}
                      </p>
                    </div>
                  )}

                  {/* Payment URL Button */}
                  {(order as any).cryptoPayment.paymentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open((order as any).cryptoPayment.paymentUrl, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en Cryptomus
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Side - Progress Timeline */}
          {(order as any).progressSteps && Array.isArray((order as any).progressSteps) && (order as any).progressSteps.length > 0 && (
            <Card className="p-6 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Progress Timeline</h3>
              </div>
              <div className="space-y-4">
                {(order as any).progressSteps.map((step: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                      {index < (order as any).progressSteps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <Badge variant="outline" className="mb-2">
                        {step.step.replace(/_/g, ' ')}
                      </Badge>
                      <p className="font-medium text-sm">{step.details || step.step.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(step.timestamp), 'PPp')}
                      </p>
                      {step.metadata && (
                        <pre className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded overflow-x-auto">
                          {JSON.stringify(step.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
