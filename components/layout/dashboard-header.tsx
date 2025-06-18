'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { User, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Breadcrumb utility function
const getBreadcrumbFromPath = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length <= 1) return 'Dashboard';
  
  const breadcrumbs = segments.map(segment => {
    // Convert kebab-case to Title Case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
  
  return breadcrumbs[breadcrumbs.length - 1];
};

export default function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  
  const currentPage = getBreadcrumbFromPath(pathname);
  const isChannelsPage = pathname.includes('/channels');

  return (
    <nav className="fixed right-3 top-3 z-[100] flex w-[calc(100vw_-_1.5rem)] flex-row items-center justify-between rounded-lg bg-white/70 py-2 px-4 backdrop-blur-xl border border-white/20 transition-all dark:bg-zinc-900/70 dark:border-zinc-800/50 md:right-6 md:top-4 md:w-[calc(100vw_-_3rem)] md:p-3">
      {/* Breadcrumb Section */}
      <div className="flex flex-col">
        <div className="hidden md:flex items-center text-xs font-normal text-zinc-600 dark:text-zinc-400">
          <Link 
            href="/dashboard" 
            className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            Dashboard
          </Link>
          {currentPage !== 'Dashboard' && (
            <>
              <span className="mx-2">/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                {currentPage}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-white">
            {currentPage}
          </h1>
          
          {/* Status badge for channels page */}
          {isChannelsPage && (
            <Badge 
              variant="outline" 
              className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* User Actions Section */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 p-0 hover:bg-white/20 dark:hover:bg-zinc-800/50"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Separator orientation="vertical" className="h-6 bg-zinc-300 dark:bg-zinc-600" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-white/20 dark:hover:bg-zinc-800/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            className="w-64 p-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50" 
            align="end"
          >
            {/* User Info */}
            <div className="flex items-center gap-3 p-2 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-700" />
            
            {/* Menu Items */}
            <DropdownMenuItem asChild>
              <Link 
                href="/dashboard/profile" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-700" />
            
            <DropdownMenuItem 
              onClick={() => signOut()}
              className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
} 