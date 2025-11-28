'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { POLLING_INTERVALS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import type { Order } from '@/types/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAYMENT_UPLOADED', label: 'Payment Uploaded' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { value: 'WAITING_FRIENDSHIP', label: 'Waiting Friendship' },
  { value: 'WAITING_PERIOD', label: 'Waiting Period' },
  { value: 'WAITING_VBUCKS', label: 'Waiting V-Bucks' },
  { value: 'WAITING_BOT_FIX', label: 'Waiting Bot Fix' },
  { value: 'WAITING_BOT', label: 'Waiting Bot' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'VIP', label: 'VIP' },
  { value: 'HIGH', label: 'High' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW', label: 'Low' },
];

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

export default function OrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, priorityFilter],
    queryFn: () =>
      ordersApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        limit: 100,
      }),
    refetchInterval: POLLING_INTERVALS.ORDERS,
  });

  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter((o) => ['PENDING', 'WAITING_FRIENDSHIP', 'WAITING_PERIOD', 'QUEUED'].includes(o.status)).length || 0,
    processing: orders?.filter((o) => o.status === 'PROCESSING').length || 0,
    completed: orders?.filter((o) => o.status === 'COMPLETED').length || 0,
    failed: orders?.filter((o) => o.status === 'FAILED').length || 0,
  };

  return (
    <>
      <Header title="Orders" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Processing</div>
            <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Failed</div>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium">{order.customer?.displayName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.customer?.epicAccountId || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.orderItems?.[0]?.productName || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{order.orderItems?.[0]?.productType || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.priority === 'VIP' ? 'default' : 'outline'}>
                        {order.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${order.finalPrice?.toFixed(2) || '0.00'} {order.currency}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No orders found with the selected filters.
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
