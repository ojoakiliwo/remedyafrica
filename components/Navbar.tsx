'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Leaf, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, profile, logout } = useAuth(); // Changed from signOut to logout
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout(); // Changed from signOut to logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#97A97C]/20 bg-[#F5F5DC]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-[#97A97C]" />
            <span className="text-2xl font-bold text-[#2C3E2D]">RemedyAfrica</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/herbs" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Herbs
            </Link>
            <Link href="/practitioners" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Practitioners
            </Link>
            <Link href="/forum" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Forum
            </Link>
            <Link href="/about" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-[#2C3E2D]">
                    <User className="w-4 h-4 mr-2" />
                    {profile?.displayName || 'Account'}
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C] hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-[#2C3E2D]">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#2C3E2D]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#97A97C]/20">
            <div className="flex flex-col space-y-4">
              <Link href="/herbs" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Herbs
              </Link>
              <Link href="/practitioners" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Practitioners
              </Link>
 <Link href="/forum" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Forum
              </Link>
              <Link href="/about" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-[#2C3E2D]">
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full border-[#97A97C] text-[#97A97C]"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-[#97A97C]/20">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-[#97A97C] text-[#97A97C]">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}