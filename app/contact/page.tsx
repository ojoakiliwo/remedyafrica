'use client';

import { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Facebook,
  Youtube,
  Instagram,
  ArrowRight,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission - replace with actual API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Message sent successfully! We will get back to you soon.');
    }, 1500);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['+234 812 345 6789', '+27 82 123 4567'],
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['info@remedyafrica.com', 'support@remedyafrica.com'],
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      details: ['+234 812 345 6789'],
      color: 'bg-green-100 text-green-600',
      whatsapp: true
    },
    {
      icon: MapPin,
      title: 'Office',
      details: ['Lagos, Nigeria', 'Johannesburg, South Africa'],
      color: 'bg-red-100 text-red-600'
    }
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://facebook.com/remedyafrica',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://youtube.com/remedyafrica',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/remedyafrica',
      color: 'bg-pink-600 hover:bg-pink-700'
    }
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '8:00 AM - 6:00 PM (WAT)' },
    { day: 'Saturday', hours: '9:00 AM - 4:00 PM (WAT)' },
    { day: 'Sunday', hours: 'Closed' }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2C3E2D] to-[#3d5238] text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            We would love to hear from you. Reach out to us for inquiries, support, or partnership opportunities.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-4 max-w-6xl mx-auto -mt-12 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mb-4`}>
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2C3E2D] mb-2">{item.title}</h3>
              <div className="space-y-1">
                {item.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-600">
                    {item.whatsapp ? (
                      <a 
                        href={`https://wa.me/${detail.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-[#97A97C] transition-colors"
                      >
                        {detail}
                      </a>
                    ) : (
                      detail
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Contact Form */}
          <section>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#2C3E2D] mb-6">Send us a Message</h2>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2C3E2D] mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We will get back to you within 24 hours.
                  </p>
                  <Button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                    }}
                    variant="outline"
                    className="border-[#97A97C] text-[#97A97C]"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+234 812 345 6789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      
                      <select
                        id="subject"
                        aria-label="Select subject"
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Customer Support</option>
                        <option value="practitioner">Become a Practitioner</option>
                        <option value="partnership">Partnership</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      className="w-full min-h-[150px] px-3 py-2 rounded-md border border-input bg-background"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="How can we help you?"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-[#97A97C] hover:bg-[#7A8A63] text-white py-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </section>

          {/* Right Column - Social & Hours */}
          <section className="space-y-8">
            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#2C3E2D] mb-6">Connect With Us</h2>
              <p className="text-gray-600 mb-6">
                Follow us on social media for health tips, herbal remedies, and updates from our community.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${social.color} text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-colors`}
                  >
                    <social.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#97A97C]/10 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#97A97C]" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C3E2D]">Business Hours</h2>
              </div>
              <div className="space-y-4">
                {businessHours.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{item.day}</span>
                    <span className="text-gray-600">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Support */}
            <div className="bg-gradient-to-br from-[#2C3E2D] to-[#3d5238] rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Need Immediate Help?</h3>
              <p className="text-gray-300 mb-6">
                For urgent inquiries, reach us directly via WhatsApp or phone. Our support team is ready to assist you.
              </p>
              <div className="space-y-3">
                <a 
                  href="https://wa.me/2348123456789" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat on WhatsApp</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </a>
                <a 
                  href="tel:+2348123456789"
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-4 rounded-lg transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>Call Us Now</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </a>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-[#97A97C]/10 rounded-2xl p-8 text-center">
              <h3 className="text-lg font-bold text-[#2C3E2D] mb-2">Frequently Asked Questions</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Find quick answers to common questions about our services.
              </p>
              <Link href="/faq">
                <Button variant="outline" className="border-[#97A97C] text-[#97A97C]">
                  View FAQ
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Map Section (Placeholder) */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#2C3E2D] mb-8">Our Locations</h2>
          <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Interactive Map</p>
              <p className="text-sm">Lagos, Nigeria & Johannesburg, South Africa</p>
              <p className="text-xs mt-2">(Integrate Google Maps or Mapbox here)</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#97A97C]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#2C3E2D] mb-4">Ready to Experience Traditional Healing?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect with verified practitioners and start your wellness journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/practitioners">
              <Button className="bg-[#97A97C] hover:bg-[#7A8A63] text-white px-8 py-6 text-lg">
                Find a Healer
              </Button>
            </Link>
            <Link href="/booking">
              <Button variant="outline" className="border-[#97A97C] text-[#97A97C] hover:bg-[#97A97C] hover:text-white px-8 py-6 text-lg">
                Book Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}