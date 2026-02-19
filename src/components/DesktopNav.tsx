import { Home, Search, Package, Truck, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Αρχική', path: '/' },
  { icon: Search, label: 'Αναζήτηση', path: '/search' },
  { icon: Package, label: 'Παραγγελίες', path: '/orders' },
  { icon: Truck, label: 'Προμηθευτές', path: '/suppliers' },
  { icon: Settings, label: 'Ρυθμίσεις', path: '/settings' },
];

export function DesktopNav() {
  const location = useLocation();

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-card border-b border-border">
      <div className="container flex items-center h-16 gap-8">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg">Διαχείριση Παραγγελιών</span>
        </Link>

        <nav className="flex items-center gap-1 ml-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'transition-colors duration-200',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
