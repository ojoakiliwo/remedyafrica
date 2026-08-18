// app/contact/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EditorialPage, PageHero } from '@/components/editorial/PageHero';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'hello@remedyafrica.com',
          subject: `Contact Form: ${formData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${formData.name}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Subject:</strong> ${formData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${formData.message.replace(/\n/g, '<br>')}</p>
          `,
          text: `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nMessage: ${formData.message}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to send');
      setSent(true);
      toast.success('Message sent! We will respond within 24 hours.');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-forest/10 shadow-lift p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-bronze" />
          </div>
          <h2 className="font-serif text-3xl text-forest mb-2">Message sent</h2>
          <p className="text-ink-muted mb-6">
            Thank you for reaching out. We will respond within 24 hours.
          </p>
          <Link href="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditorialPage>
      <PageHero
        eyebrow="A letter"
        title="Write to us"
        subtitle="We read every note. Reach the house in Lagos, or send a message here."
      />

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-6 text-center">
            <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-bronze" />
            </div>
            <h3 className="font-serif text-xl text-forest mb-1">Email</h3>
            <a href="mailto:hello@remedyafrica.com" className="text-bronze hover:text-forest text-sm">
              hello@remedyafrica.com
            </a>
          </div>
          <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-6 text-center">
            <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-bronze" />
            </div>
            <h3 className="font-serif text-xl text-forest mb-1">Phone</h3>
            <a href="tel:+2348000000000" className="text-bronze hover:text-forest text-sm">
              +234 800 000 0000
            </a>
          </div>
          <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-6 text-center">
            <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-bronze" />
            </div>
            <h3 className="font-serif text-xl text-forest mb-1">Location</h3>
            <p className="text-ink-muted text-sm">Lagos, Nigeria</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-forest/10 shadow-soft p-8">
          <h2 className="font-serif text-2xl text-forest mb-6">Send a message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-forest mb-1">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-forest/15 rounded-2xl bg-cream focus:ring-2 focus:ring-forest outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2C3E2D] mb-1">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-forest/15 rounded-2xl bg-cream focus:ring-2 focus:ring-forest outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-[#2C3E2D] mb-1">Subject *</label>
              <select
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full p-3 border border-forest/15 rounded-2xl bg-cream focus:ring-2 focus:ring-forest outline-none"
              >
                <option value="">Select a subject</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Practitioner Application">Practitioner Application</option>
                <option value="Billing Question">Billing Question</option>
                <option value="Report an Issue">Report an Issue</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-[#2C3E2D] mb-1">Message *</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 border border-forest/15 rounded-2xl bg-cream focus:ring-2 focus:ring-forest outline-none"
                placeholder="How can we help you?"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12"
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
        </div>
      </div>
    </EditorialPage>
  );
}