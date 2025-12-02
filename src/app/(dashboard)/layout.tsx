'use client';

import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[DashboardLayout] Rendering with children:', !!children);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
