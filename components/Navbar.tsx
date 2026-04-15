'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Leaf, Menu, X, User, LayoutDashboard, LogOut } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get display name from profile or email
  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#97A97C]/20 bg-[#F5F5DC]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with actual image */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <img 
                src="/logo.png" 
                alt="RemedyAfrica" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const leafDiv = document.createElement('div');
                    leafDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#97A97C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';
                    parent.appendChild(leafDiv.firstChild!);
                  }
                }}
              />
            </div>
            <span className="text-2xl font-bold text-[#2C3E2D]">RemedyAfrica</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Home
            </Link>
            <Link href="/herbs" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Herbs
            </Link>
            <Link href="/practitioners" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Practitioners
            </Link>
            <Link href="/forum" className="text-[#2C3E2D] hover:text-[#97A97C] transition-colors">
              Forum
            </Link>
          </div>

          {/* Auth Buttons / Profile Dropdown */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {profile?.photoURL ? (
                    <img 
                      src={profile.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#97A97C]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#97A97C] flex items-center justify-center text-white font-bold border-2 border-[#97A97C]">
                      {firstLetter}
                    </div>
                  )}
                  <span className="text-[#2C3E2D] font-medium max-w-[100px] truncate">
                    {displayName}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-[#2C3E2D] truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
              <Link href="/" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/herbs" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Herbs
              </Link>
              <Link href="/practitioners" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Practitioners
              </Link>
              <Link href="/forum" className="text-[#2C3E2D] hover:text-[#97A97C]" onClick={() => setMobileMenuOpen(false)}>
                Forum
              </Link>
              
              {user ? (
                <>
                  <div className="flex items-center space-x-2 px-2 py-2 bg-gray-50 rounded">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#97A97C] flex items-center justify-center text-white font-bold">
                        {firstLetter}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[#2C3E2D]">{displayName}</p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-[#2C3E2D] hover:text-[#97A97C] pl-4">
                    My Profile
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-[#2C3E2D] hover:text-[#97A97C] pl-4">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-red-600 pl-4"
                  >
                    Logout
                  </button>
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