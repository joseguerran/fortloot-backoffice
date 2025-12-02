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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/5 bg-background/80 backdrop-blur-lg px-4 sticky top-0 z-40">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6 bg-white/10" />
      <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
