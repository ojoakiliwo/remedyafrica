'use client';

import Link from 'next/link';
import { 
  Leaf, 
  Heart, 
  Shield, 
  Users, 
  Globe, 
  Award,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Holistic Healing',
      description: 'We believe in treating the whole person—body, mind, and spirit—using time-tested traditional African medicine combined with modern wellness practices.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Every practitioner on our platform is thoroughly vetted and verified. We ensure all herbal remedies are properly documented and sourced responsibly.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built by Africans, for Africans. We celebrate and preserve indigenous knowledge while making it accessible to the modern world.'
    },
    {
      icon: Globe,
      title: 'Cultural Heritage',
      description: 'We are committed to preserving and promoting Africa rich tradition of herbal medicine, ensuring this wisdom is passed to future generations.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Herbal Remedies' },
    { number: '200+', label: 'Verified Practitioners' },
    { number: '10,000+', label: 'Consultations' },
    { number: '15+', label: 'African Countries' }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2C3E2D] to-[#3d5238] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About Us</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Bridging traditional African healing wisdom with modern healthcare accessibility
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 -mt-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#2C3E2D] mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              RemedyAfrica was founded with a simple yet powerful mission: to make traditional African herbal medicine 
              accessible, verifiable, and safe for everyone. We believe that the continent rich heritage of natural 
              healing holds solutions to many of today health challenges.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              By connecting patients with verified traditional healers and providing a comprehensive database of 
              herbal remedies, we are creating a bridge between ancient wisdom and modern wellness needs.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-[#97A97C]/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-[#2C3E2D] mb-2">{stat.number}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#2C3E2D] mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                RemedyAfrica began in 2024 when a group of traditional healers, tech enthusiasts, and healthcare 
                professionals came together with a shared vision: to preserve and promote Africa herbal heritage 
                in the digital age.
              </p>
              <p>
                We noticed that while traditional medicine remained the primary healthcare option for millions 
                of Africans, there was no reliable way to verify practitioners or access information about 
                herbal remedies safely.
              </p>
              <p>
                Today, RemedyAfrica serves as the leading platform connecting patients with verified traditional 
                healers across 15+ African countries. Our community includes over 200 verified practitioners 
                and a growing database of 500+ herbal remedies.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#97A97C]" />
                <span className="text-gray-700">Verified practitioner network</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#97A97C]" />
                <span className="text-gray-700">Secure video consultations</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#97A97C]" />
                <span className="text-gray-700">Comprehensive herbal database</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-[#97A97C]/20 rounded-2xl p-8 h-96 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="RemedyAfrica" 
                className="h-48 w-48 object-contain opacity-80"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">Our Values</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The principles that guide everything we do at RemedyAfrica
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-[#97A97C]/10 rounded-full flex items-center justify-center mb-4">
                <value.icon className="w-6 h-6 text-[#97A97C]" />
              </div>
              <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-[#2C3E2D] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose RemedyAfrica?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#97A97C] rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Verified Experts</h3>
                    <p className="text-gray-300">
                      Every practitioner undergoes rigorous verification including credential checks, 
                      background verification, and peer reviews.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#97A97C] rounded-full flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Authentic Remedies</h3>
                    <p className="text-gray-300">
                      Our herbal database is curated by traditional healers and botanists to ensure 
                      accuracy and safety of information.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#97A97C] rounded-full flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Pan-African Reach</h3>
                    <p className="text-gray-300">
                      Connect with healers from across the continent, accessing diverse traditional 
                      knowledge systems and specialties.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
              <p className="text-gray-300 mb-6">
                Whether you are seeking natural healing solutions or you are a practitioner looking 
                to reach more patients, RemedyAfrica is your platform.
              </p>
              <div className="space-y-3">
                <Link href="/practitioners">
                  <Button className="w-full bg-[#97A97C] hover:bg-[#7A8A63] text-white py-6">
                    Find a Healer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/practitioners/apply">
                  <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-[#2C3E2D] py-6">
                    Apply as Practitioner
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#97A97C]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">Ready to Start Your Healing Journey?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect with verified traditional healers and discover the power of African herbal medicine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practitioners">
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8 py-6 text-lg">
                Find a Healer
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C] hover:text-white px-8 py-6 text-lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}