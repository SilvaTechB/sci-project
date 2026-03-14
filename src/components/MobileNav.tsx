import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, Archive, Settings, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const studentNav: NavItem[] = [
  { href: '/student', icon: Home, label: 'Home' },
  { href: '/archive', icon: Archive, label: 'Archive' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const lecturerNav: NavItem[] = [
  { href: '/lecturer', icon: Home, label: 'Home' },
  { href: '/archive', icon: Archive, label: 'Archive' },
  { href: '/users', icon: Users, label: 'Users' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const MobileNav = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const navItems = profile?.role === 'lecturer' ? lecturerNav : studentNav;

  return (
    <nav className="mobile-nav">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = location.pathname === href;
        return (
          <Link
            key={href}
            to={href}
            className={cn(
              'mobile-nav-item',
              isActive && 'mobile-nav-item-active'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('text-[10px] font-medium mt-0.5', isActive ? 'text-primary' : 'text-muted-foreground')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
