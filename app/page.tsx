'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  Search,
  ArrowRight,
  Shield,
  Video,
  Leaf
} from 'lucide-react';
import { useState } from 'react';
import HerbIdentifier from '@/components/HerbIdentifier';

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Section */}
      <section className="bg-[#2C3E2D] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="RemedyAfrica" 
                className="h-16 w-16 object-contain drop-shadow-lg"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-16 w-16 bg-[#97A97C] rounded-full flex items-center justify-center">
                <Leaf className="h-10 w-10 text-white" />
              </div>
            )}
            <h1 className="text-5xl md:text-6xl font-bold">RemedyAfrica</h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover traditional African herbal remedies and connect with verified practitioners for holistic healing
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practitioners">
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8 py-6 text-lg">
                <Users className="w-5 h-5 mr-2" />
                Find a Healer
              </Button>
            </Link>
            <Link href="/category/mental-wellness">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#2C3E2D] px-8 py-6 text-lg">
                <Search className="w-5 h-5 mr-2" />
                Explore Remedies
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Herb Identifier Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">
              Identify Herbs Instantly
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Take a photo of any herb to identify it using AI and learn about its traditional African medicinal uses.
            </p>
          </div>
          <HerbIdentifier />
        </div>
      </section>

      {/* Quick Navigation Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-[#2C3E2D]">Explore Our Platform</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Access all features of RemedyAfrica - from herbal remedies to practitioner consultations
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Herbs Database */}
          <Link href="/category/mental-wellness" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <img src="/logo.png" alt="Herbs" className="w-8 h-8 object-contain opacity-80" onError={(e) => {e.currentTarget.style.display='none'}} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Herbal Remedies</h3>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive database of traditional African herbs, their benefits, and preparation methods.
              </p>
              <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore Herbs <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Find Practitioners */}
          <Link href="/practitioners" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Find a Healer</h3>
              <p className="text-gray-600 mb-4">
                Connect with verified traditional medicine practitioners across Africa. View profiles, ratings, and specialties.
              </p>
              <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                View Practitioners <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Book Consultation */}
          <Link href="/booking" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <Calendar className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Book Consultation</h3>
              <p className="text-gray-600 mb-4">
                Schedule video or audio consultations with practitioners. Get personalized advice and treatment plans.
              </p>
              <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Book Now <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Community Forum */}
          <Link href="/forum" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <MessageCircle className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Community</h3>
              <p className="text-gray-600 mb-4">
                Join discussions, ask questions, and share experiences with our community of herbal wellness enthusiasts.
              </p>
              <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Join Discussion <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Video Consultations */}
          <Link href="/profile" className="group">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <Video className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">My Consultations</h3>
              <p className="text-gray-600 mb-4">
                Access your scheduled consultations, join video calls, and view your consultation history.
              </p>
              <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Admin Access - ONLY visible to admins */}
          {isAdmin && (
            <Link href="/admin" className="group">
              <div className="bg-[#2C3E2D] text-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 h-full">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">Admin Dashboard</h3>
                <p className="text-gray-300 mb-4">
                  Manage herbs, review practitioner applications, and oversee platform content.
                </p>
                <span className="text-[#97A97C] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Access Admin <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* For Practitioners */}
      <section className="py-16 px-4 bg-[#97A97C]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-[#2C3E2D]">Are You a Traditional Healer?</h2>
          <p className="text-lg mb-8 text-gray-700">
            Join our network of verified practitioners and reach patients across Africa. 
            Offer consultations, share your knowledge, and grow your practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practitioners/apply">
              <Button className="bg-[#2C3E2D] hover:bg-[#3d523e] text-white px-8 py-6 text-lg">
                Apply as Practitioner
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-[#2C3E2D] text-[#2C3E2D] hover:bg-[#2C3E2D] hover:text-white px-8 py-6 text-lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-16 h-16 bg-[#97A97C]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/logo.png" alt="Traditional" className="w-10 h-10 object-contain" onError={(e) => {e.currentTarget.style.display='none'}} />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Traditional Wisdom</h3>
            <p className="text-gray-600">
              Access centuries of African herbal knowledge, carefully documented and verified.
            </p>
          </div>
          <div>
            <div className="w-16 h-16 bg-[#97A97C]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-[#97A97C]" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Video Consultations</h3>
            <p className="text-gray-600">
              Connect face-to-face with practitioners through secure video and audio calls.
            </p>
          </div>
          <div>
            <div className="w-16 h-16 bg-[#97A97C]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#97A97C]" />
            </div>
            <h3 className="font-bold text-xl mb-2 text-[#2C3E2D]">Verified Practitioners</h3>
            <p className="text-gray-600">
              All healers are thoroughly vetted and verified for your safety and trust.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C3E2D] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="RemedyAfrica" className="h-8 w-8 object-contain" onError={(e) => {e.currentTarget.style.display='none'}} />
              <span className="font-bold text-xl">RemedyAfrica</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting traditional healing with modern wellness.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/practitioners" className="hover:text-white">Find a Healer</Link></li>
              <li><Link href="/category/mental-wellness" className="hover:text-white">Herbal Remedies</Link></li>
              <li><Link href="/booking" className="hover:text-white">Book Consultation</Link></li>
              <li><Link href="/forum" className="hover:text-white">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">For Practitioners</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/practitioners/apply" className="hover:text-white">Apply Now</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              {isAdmin && (
                <li><Link href="/admin" className="hover:text-white">Admin Dashboard</Link></li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {user ? (
                <>
                  <li><Link href="/profile" className="hover:text-white">My Profile</Link></li>
                  <li><Link href="/practitioners/dashboard" className="hover:text-white">Practitioner Dashboard</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/login" className="hover:text-white">Login</Link></li>
                  <li><Link href="/signup" className="hover:text-white">Sign Up</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/20 text-center text-gray-400 text-sm">
          © 2026 RemedyAfrica. All rights reserved.
        </div>
      </footer>
    </div>
  );
}