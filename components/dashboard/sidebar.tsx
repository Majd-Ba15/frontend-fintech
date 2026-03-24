'use client';

import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Settings,
  ClipboardList,
  UserCog,
  Building2,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const adminLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'User Management', icon: UserCog },
  { href: '/dashboard/teams', label: 'Team Management', icon: Building2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const teamLeaderLinks = [
  { href: '/dashboard', label: 'Workload Overview', icon: LayoutDashboard },
  { href: '/dashboard/tasks/new', label: 'Create Task', icon: ClipboardList },
  { href: '/dashboard/tasks', label: 'Task Management', icon: CheckSquare },
  { href: '/dashboard/team', label: 'My Team', icon: Users },
  { href: '/dashboard/requests', label: 'Change Requests', icon: FileText },
];

const memberLinks = [
  { href: '/dashboard', label: 'My Tasks', icon: CheckSquare },
  { href: '/dashboard/requests', label: 'My Requests', icon: FileText },
];

export function DashboardSidebar() {
  const { user } = useAuth();
  const pathname = useLocation().pathname;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const links =
    user?.role === 'admin'
      ? adminLinks
      : user?.role === 'team_leader'
      ? teamLeaderLinks
      : memberLinks;

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'team_leader'
      ? 'Team Leader'
      : 'Team Member';

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-sidebar-foreground">TaskFlow</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="px-3 py-2 rounded-md bg-primary/10">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-sm font-medium text-primary">{roleLabel}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button - rendered elsewhere via context or prop */}
    </>
  );
}

export function useSidebarToggle() {
  // This would be implemented with a context for mobile sidebar toggle
  return { toggle: () => {} };
}
