import { Home, Search, Package, Truck, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Αρχική', path: '/' },
  { icon: Search, label: 'Αναζήτηση', path: '/search' },
  { icon: Package, label: 'Παραγγελίες', path: '/orders' },
  { icon: Truck, label: 'Προμηθευτές', path: '/suppliers' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-colors duration-200',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-1',
                isActive && 'stroke-[2.5px]'
              )} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
