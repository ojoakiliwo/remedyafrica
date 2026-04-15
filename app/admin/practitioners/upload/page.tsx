'use client';

import { useState } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function UploadPractitionerPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    specialty: 'mental-wellness',
    location: '',
    experience: '',
    bio: '',
    imageUrl: '',
    consultationFee: '',
    languages: '',
    certifications: '',
    services: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const practitionerData = {
        ...formData,
        experience: parseInt(formData.experience),
        consultationFee: parseInt(formData.consultationFee),
        languages: formData.languages.split(',').map(l => l.trim()),
        certifications: formData.certifications.split(',').map(c => c.trim()),
        services: formData.services.split(',').map(s => s.trim()),
        rating: 0,
        reviews: 0,
        isVerified: true,
        isActive: true,
        nextAvailable: "Today",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'practitioners'), practitionerData);
      setSuccess(true);
      setFormData({
        name: '', title: '', specialty: 'mental-wellness', location: '',
        experience: '', bio: '', imageUrl: '', consultationFee: '',
        languages: '', certifications: '', services: ''
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#2C3E2D]">Practitioner Added!</h2>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-4 bg-[#97A97C] text-white px-6 py-2 rounded"
        >
          Add Another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-[#2C3E2D] mb-6">Add Practitioner</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="practitioner-name" className="block font-semibold text-[#2C3E2D] mb-1">Full Name</label>
            <input 
              id="practitioner-name"
              type="text" 
              placeholder="Full Name" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label htmlFor="practitioner-title" className="block font-semibold text-[#2C3E2D] mb-1">Title</label>
            <input 
              id="practitioner-title"
              type="text" 
              placeholder="Title (e.g., Traditional Healer)" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-specialty" className="block font-semibold text-[#2C3E2D] mb-1">Specialty</label>
            <select 
              id="practitioner-specialty"
              value={formData.specialty}
              onChange={e => setFormData({...formData, specialty: e.target.value})}
              className="w-full p-2 border rounded"
              aria-label="Select practitioner specialty"
            >
              <option value="mental-wellness">Mental Wellness</option>
              <option value="pain-relief">Pain Relief</option>
              <option value="digestive-health">Digestive Health</option>
              <option value="immune-support">Immune Support</option>
              <option value="skin-care">Skin Care</option>
            </select>
          </div>

          <div>
            <label htmlFor="practitioner-location" className="block font-semibold text-[#2C3E2D] mb-1">Location</label>
            <input 
              id="practitioner-location"
              type="text" 
              placeholder="Location (e.g., Lagos, Nigeria)"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-experience" className="block font-semibold text-[#2C3E2D] mb-1">Years of Experience</label>
            <input 
              id="practitioner-experience"
              type="number" 
              placeholder="Years of Experience"
              value={formData.experience}
              onChange={e => setFormData({...formData, experience: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-fee" className="block font-semibold text-[#2C3E2D] mb-1">Consultation Fee (USD)</label>
            <input 
              id="practitioner-fee"
              type="number" 
              placeholder="Consultation Fee (USD)"
              value={formData.consultationFee}
              onChange={e => setFormData({...formData, consultationFee: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-image" className="block font-semibold text-[#2C3E2D] mb-1">Image URL</label>
            <input 
              id="practitioner-image"
              type="url" 
              placeholder="Image URL (Unsplash/Pexels)"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-bio" className="block font-semibold text-[#2C3E2D] mb-1">Bio</label>
            <textarea 
              id="practitioner-bio"
              placeholder="Bio" 
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-languages" className="block font-semibold text-[#2C3E2D] mb-1">Languages (comma-separated)</label>
            <input 
              id="practitioner-languages"
              type="text" 
              placeholder="Languages (comma-separated)"
              value={formData.languages}
              onChange={e => setFormData({...formData, languages: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="practitioner-services" className="block font-semibold text-[#2C3E2D] mb-1">Services (comma-separated)</label>
            <input 
              id="practitioner-services"
              type="text" 
              placeholder="Services (comma-separated)"
              value={formData.services}
              onChange={e => setFormData({...formData, services: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#97A97C] text-white p-3 rounded font-bold hover:bg-[#7A8A63] disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add Practitioner'}
          </button>
        </form>
      </div>
    </div>
  );
}