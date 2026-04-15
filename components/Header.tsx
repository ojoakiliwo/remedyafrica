'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Crown } from 'lucide-react';

export function Header() {
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#97A97C]/20 bg-[#F5F5DC]/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* CLICKABLE LOGO - Links to homepage */}
        <Link href="/" className="flex items-center space-x-3 group">
          <img 
            src="/logo.png" 
            alt="RemedyAfrica" 
            className="h-10 w-10 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="text-xl font-bold text-[#2C3E2D] hidden sm:inline-block group-hover:text-[#97A97C] transition-colors">
            RemedyAfrica
          </span>
        </Link>

        <div className="flex items-center space-x-4">
          {/* FORUM LINK - Always visible */}
          <Button variant="ghost" asChild>
            <Link href="/forum">Forum</Link>
          </Button>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <div className="h-10 w-10 rounded-full bg-[#97A97C]/20 flex items-center justify-center border-2 border-[#97A97C]/30">
                    <User className="h-5 w-5 text-[#97A97C]" />
                  </div>
                  {profile?.subscriptionTier !== 'free' && (
                    <Crown className="absolute -top-1 -right-1 h-4 w-4 text-[#B8860B]" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.displayName || user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/subscription">Subscription</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}