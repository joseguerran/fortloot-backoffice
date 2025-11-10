'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
