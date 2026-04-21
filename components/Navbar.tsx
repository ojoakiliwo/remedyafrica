'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/category/all', label: 'Categories' },
    { href: '/practitioners', label: 'Practitioners' },
    { href: '/forum', label: 'Forum' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#e8e4df] bg-[#faf9f7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5c7c6b]">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2c3e33]">
            Remedy<span className="text-[#b89f6b]">Africa</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-[#5c7c6b]/10 text-[#5c7c6b]'
                  : 'text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#2c3e33]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Search Toggle */}
          <div className="hidden md:block">
            {searchOpen ? (
              <form onSubmit={handleQuickSearch} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Search herbs, symptoms..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="h-9 w-64 border-[#d4cfc7] bg-white text-sm focus-visible:ring-[#5c7c6b]"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-9 bg-[#5c7c6b] hover:bg-[#4a6354]"
                >
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
                className="text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#5c7c6b]"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Mobile Search Link */}
          <Link href="/search" className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#5a5a5a] hover:bg-[#5c7c6b]/5 hover:text-[#5c7c6b]"
            >
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3">
                  <Avatar className="h-7 w-7 border border-[#e8e4df]">
                    <AvatarFallback className="bg-[#5c7c6b]/10 text-xs font-medium text-[#5c7c6b]">
                      {(userData?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[100px] truncate text-sm font-medium text-[#2c3e33] sm:block">
                    {userData?.displayName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-[#999] sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-[#e8e4df] bg-white">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-[#2c3e33]">{user.email}</p>
                  {isAdmin && (
                    <p className="mt-0.5 text-xs text-[#b89f6b] font-medium">Administrator</p>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-[#e8e4df]" />
                
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin/applications" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/consultations" className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> My Consultations
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/forum" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Forum
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#e8e4df]" />
                
                <DropdownMenuItem 
                  onClick={logout} 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-sm font-medium text-[#5a5a5a] hover:text-[#2c3e33]">
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

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[#e8e4df] bg-white px-4 py-4 md:hidden">
          <form onSubmit={handleQuickSearch} className="mb-4 flex gap-2">
            <Input
              placeholder="Search herbs, symptoms..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="flex-1 border-[#d4cfc7]"
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
                    ? 'bg-[#5c7c6b]/10 text-[#5c7c6b]'
                    : 'text-[#5a5a5a] hover:bg-[#5c7c6b]/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 rounded-md px-3 py-2.5 text-sm font-medium text-[#5a5a5a] hover:bg-[#5c7c6b]/5"
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