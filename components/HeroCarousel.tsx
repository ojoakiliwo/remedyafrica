'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Leaf, 
  Users, 
  Calendar, 
  MessageCircle, 
  Search,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setUserMenuOpen(false);
  };

  // Don't show navbar on homepage hero section (optional - remove if you want it everywhere)
  // if (pathname === '/') return null;

  const mainNavLinks = [
    { href: '/category/mental-wellness', label: 'Remedies', icon: Leaf },
    { href: '/practitioners', label: 'Find Healer', icon: Users },
    { href: '/booking', label: 'Book Consultation', icon: Calendar },
    { href: '/forum', label: 'Community', icon: MessageCircle },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-[#2C3E2D] p-2 rounded-lg group-hover:bg-[#3d523e] transition-colors">
                <Leaf className="w-6 h-6 text-[#97A97C]" />
              </div>
              <span className="font-bold text-xl text-[#2C3E2D] hidden sm:block">RemedyAfrica</span>
            </Link>
          </div>

          {/* Desktop Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith(link.href)
                    ? 'text-[#97A97C] bg-[#97A97C]/10'
                    : 'text-gray-700 hover:text-[#97A97C] hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#97A97C]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#97A97C]/20 flex items-center justify-center border-2 border-[#97A97C]">
                      <User className="w-4 h-4 text-[#97A97C]" />
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-[#2C3E2D] truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#97A97C]/10 hover:text-[#2C3E2D] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#97A97C]/10 hover:text-[#2C3E2D] transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        My Consultations
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#2C3E2D] hover:bg-[#97A97C]/10 font-medium transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#97A97C]" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#2C3E2D]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#97A97C] hover:bg-[#7A8A63] text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#2C3E2D]" />
              ) : (
                <Menu className="w-6 h-6 text-[#2C3E2D]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top">
            <div className="space-y-1">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium ${
                    pathname.startsWith(link.href)
                      ? 'text-[#97A97C] bg-[#97A97C]/10'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              
              {user && (
                <>
                  <div className="border-t border-gray-100 my-2 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-5 h-5" />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Calendar className="w-5 h-5" />
                      My Consultations
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-[#2C3E2D] hover:bg-[#97A97C]/10"
                      >
                        <Shield className="w-5 h-5 text-[#97A97C]" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}