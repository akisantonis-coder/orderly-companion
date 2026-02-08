import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';
import { OfflineIndicator } from './OfflineIndicator';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <BottomNav />
      <OfflineIndicator />
    </div>
  );
}
