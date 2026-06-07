'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Leaf, 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Shield, 
  MessageSquare, 
  Video,
  ChevronDown,
  Crown,
  Lock,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const { tier, isPremiumPro } = useSubscription();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = userData?.role === 'admin';

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(quickSearch.trim())}`);
      setQuickSearch('');
      setSearchOpen(false);
    } else {
      router.push('/search');
    }
  };

  const baseNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/category/', label: 'Categories' },
    { href: '/practitioners', label: 'Practitioners' },
  ];

  const navLinks = (isPremiumPro || isAdmin)
    ? [...baseNavLinks, { href: '/forum', label: 'Forum' }]
    : baseNavLinks;

  const themeIcon = !mounted ? (
    <div className="h-5 w-5" />
  ) : resolvedTheme === 'dark' ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Moon className="h-5 w-5" />
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#e8e4df] dark:border-[#2a3a2b] bg-white/95 dark:bg-[#1e2b1f]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm overflow-hidden">
            <img 
              src="/logo.png" 
              alt="RemedyAfrica" 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
              }}
            />
            <Leaf className="h-6 w-6 text-[#5c7c6b] hidden fallback-icon" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2c3e33] dark:text-[#F5F5F0]">
            Remedy<span className="text-[#b89f6b]">Africa</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-[#5c7c6b]/10 text-[#5c7c6b] dark:bg-[#97A97C]/20 dark:text-[#a3b58a]'
                  : 'text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#2c3e33] dark:text-gray-300 dark:hover:bg-[#97A97C]/10 dark:hover:text-[#F5F5F0]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!isPremiumPro && !isAdmin && user && (
            <Link
              href="/subscription"
              className="rounded-md px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 flex items-center gap-1"
            >
              <Lock className="h-3 w-3" />
              Forum
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#5c7c6b] dark:text-gray-300 dark:hover:bg-[#97A97C]/10"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {themeIcon}
          </Button>

          <div className="hidden md:block">
            {searchOpen ? (
              <form onSubmit={handleQuickSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search herbs, symptoms..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="h-9 w-64 border-[#d4cfc7] bg-white text-sm focus-visible:ring-[#5c7c6b] dark:bg-[#2a3a2b] dark:border-[#3d523e] dark:text-white"
                  autoFocus
                />
                <Button type="submit" size="sm" className="h-9 bg-[#5c7c6b] hover:bg-[#4a6354]">
                  <Search className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-2"
                  onClick={() => { setSearchOpen(false); setQuickSearch(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#5c7c6b] dark:text-gray-300 dark:hover:bg-[#97A97C]/10"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          <Link href="/search" className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#5c7c6b] dark:text-gray-300"
            >
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {user && tier !== 'free' && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
              <Crown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300 capitalize">{tier}</span>
            </div>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
                  <Avatar className="h-7 w-7 border border-[#e8e4df] dark:border-[#3d523e]">
                    <AvatarFallback className="bg-[#5c7c6b]/10 text-xs font-medium text-[#5c7c6b] dark:bg-[#97A97C]/20 dark:text-[#a3b58a]">
                      {(userData?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[100px] truncate text-sm font-medium text-[#2c3e33] dark:text-[#F5F5F0] sm:block">
                    {userData?.displayName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-[#999] dark:text-gray-400 sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-[#e8e4df] bg-white dark:bg-[#1e2b1f] dark:border-[#3d523e]">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-[#2c3e33] dark:text-[#F5F5F0]">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium capitalize">{tier} Plan</p>
                  </div>
                  {isAdmin && (
                    <p className="mt-0.5 text-xs text-[#b89f6b] font-medium">Administrator</p>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-[#e8e4df] dark:bg-[#3d523e]" />
                
                <DropdownMenuItem asChild className="cursor-pointer dark:text-gray-300 dark:focus:bg-[#2a3a2b] dark:focus:text-white">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild className="cursor-pointer dark:text-gray-300 dark:focus:bg-[#2a3a2b] dark:focus:text-white">
                  <Link href="/subscription" className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" /> Subscription
                  </Link>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer dark:text-gray-300 dark:focus:bg-[#2a3a2b] dark:focus:text-white">
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="cursor-pointer dark:text-gray-300 dark:focus:bg-[#2a3a2b] dark:focus:text-white">
                  <Link href="/consultations" className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> My Consultations
                  </Link>
                </DropdownMenuItem>

                {(isPremiumPro || isAdmin) && (
                  <DropdownMenuItem asChild className="cursor-pointer dark:text-gray-300 dark:focus:bg-[#2a3a2b] dark:focus:text-white">
                    <Link href="/forum" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Forum
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-[#e8e4df] dark:bg-[#3d523e]" />
                
                <DropdownMenuItem 
                  onClick={logout} 
                  className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-sm font-medium text-[#5a5a5a] hover:text-[#2c3e33] dark:text-gray-300 dark:hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#5c7c6b] text-sm font-medium hover:bg-[#4a6354]">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden dark:text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#e8e4df] dark:border-[#2a3a2b] bg-white dark:bg-[#1e2b1f] px-4 py-4 md:hidden">
          <form onSubmit={handleQuickSearch} className="mb-4 flex gap-2">
            <Input
              placeholder="Search herbs, symptoms..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="flex-1 border-[#d4cfc7] dark:bg-[#2a3a2b] dark:border-[#3d523e] dark:text-white"
            />
            <Button type="submit" className="bg-[#5c7c6b] hover:bg-[#4a6354]">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-[#5c7c6b]/10 text-[#5c7c6b] dark:bg-[#97A97C]/20 dark:text-[#a3b58a]'
                    : 'text-[#5a5a5a] hover:bg-[#5c7c6b]/5 dark:text-gray-300 dark:hover:bg-[#97A97C]/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isPremiumPro && !isAdmin && user && (
              <Link
                href="/subscription"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" /> Unlock Forum
              </Link>
            )}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 rounded-md px-3 py-2.5 text-sm font-medium text-[#5a5a5a] hover:bg-[#5c7c6b]/5 dark:text-gray-300 dark:hover:bg-[#97A97C]/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}