'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DashboardHeader from '@/components/layout/dashboard-header';
import { 
  LayoutDashboard, 
  Hash,
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Channels',
    href: '/channels',
    icon: Hash,
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ telegram_username?: string; telegram_first_name?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Проверяем аутентификацию и получаем данные пользователя
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar Card with glassmorphism */}
        <div className="m-3 h-[calc(100vh-1.5rem)] rounded-lg bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl dark:bg-zinc-900/70 dark:border-zinc-800/50">
          <div className="flex h-full flex-col">
            {/* Logo Header */}
            <div className="flex h-20 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-white">TGeasy</h1>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Telegram Ads</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-zinc-200 dark:bg-zinc-700" />

            {/* Navigation */}
            <nav className="flex-1 space-y-2 px-4 py-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-white/40 hover:text-zinc-900 transition-all duration-200 dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
              {user && (
                <div className="mb-4 rounded-lg bg-white/40 p-4 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {(user.telegram_first_name || user.telegram_username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {user.telegram_first_name || user.telegram_username || 'User'}
                      </p>
                      {user.telegram_username && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          @{user.telegram_username}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:ml-80">
        {/* New Horizon-style header */}
        <DashboardHeader />
        
        {/* Mobile menu button - positioned absolute to avoid layout shifts */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-[101] lg:hidden h-9 w-9 p-0 bg-white/70 backdrop-blur-xl border border-white/20 dark:bg-zinc-900/70 dark:border-zinc-800/50"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Page content with proper spacing for fixed header */}
        <main className="pt-20 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 