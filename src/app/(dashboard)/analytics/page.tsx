'use client';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <>
      <Header title="Analytics" />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed analytics and reporting features will be available here.
            </p>
            <p className="mt-2 text-muted-foreground text-sm">
              This page is under development and will include:
            </p>
            <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Revenue trends over time</li>
              <li>Bot performance comparison</li>
              <li>Order fulfillment metrics</li>
              <li>Customer analytics</li>
              <li>Export functionality (CSV/PDF)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
