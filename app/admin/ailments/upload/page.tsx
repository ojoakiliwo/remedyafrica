'use client';

import { useState } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export default function UploadAilmentPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'mental-wellness',
    description: '',
    symptoms: '',
    medicalDisclaimer: 'This information is educational only. Please consult a healthcare provider for proper diagnosis and treatment.',
    categoryLabel: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const symptomsArray = formData.symptoms.split(',').map(s => s.trim()).filter(s => s);

      const ailmentData = {
        name: formData.name,
        category: formData.category,
        categoryLabel: formData.categoryLabel || formData.category.replace('-', ' '),
        description: formData.description,
        symptoms: symptomsArray,
        medicalDisclaimer: formData.medicalDisclaimer,
        associatedHerbs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'ailments'), ailmentData);
      
      console.log('Ailment added successfully!');
      setSuccess(true);
      
      setFormData({
        name: '',
        category: 'mental-wellness',
        description: '',
        symptoms: '',
        medicalDisclaimer: 'This information is educational only. Please consult a healthcare provider for proper diagnosis and treatment.',
        categoryLabel: ''
      });
      
    } catch (error: any) {
      console.error('Error:', error);
      setError('Failed to add ailment: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#2C3E2D] mb-4">Ailment Added Successfully!</h2>
        <p className="text-gray-600 mb-6">The condition has been saved to the database.</p>
        <div className="space-x-4">
          <button 
            onClick={() => setSuccess(false)}
            className="bg-[#97A97C] text-white px-6 py-2 rounded hover:bg-[#7A8A63]"
          >
            Add Another
          </button>
          <Link href="/admin" className="text-[#97A97C] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="bg-[#2C3E2D] text-white p-4 rounded-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Add New Ailment/Condition</h1>
          <p className="text-sm text-gray-300">Add to database (no images required)</p>
        </div>
        <Link href="/admin" className="text-sm hover:underline">← Back to Admin</Link>
      </div>

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">❌ Error: {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ailment-name" className="block font-bold text-[#2C3E2D] mb-1">Condition Name *</label>
              <input 
                id="ailment-name"
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., Anxiety"
              />
            </div>
            <div>
              <label htmlFor="ailment-category" className="block font-bold text-[#2C3E2D] mb-1">Category *</label>
              <select 
                id="ailment-category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
                aria-label="Select ailment category"
              >
                <option value="mental-wellness">Mental Wellness</option>
                <option value="pain-relief">Pain Relief</option>
                <option value="digestive-health">Digestive Health</option>
                <option value="immune-support">Immune Support</option>
                <option value="skin-care">Skin Care</option>
                <option value="respiratory">Respiratory Health</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ailment-description" className="block font-bold text-[#2C3E2D] mb-1">Detailed Description *</label>
            <textarea 
              id="ailment-description"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
              rows={4}
              placeholder="Explain what this condition is, causes, and overview..."
            />
          </div>

          <div>
            <label htmlFor="ailment-symptoms" className="block font-bold text-[#2C3E2D] mb-1">Common Symptoms (comma-separated) *</label>
            <input 
              id="ailment-symptoms"
              type="text"
              required
              value={formData.symptoms}
              onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., Excessive worrying, Restlessness, Fatigue, Difficulty sleeping"
            />
            <p className="text-xs text-gray-500 mt-1">Separate each symptom with a comma</p>
          </div>

          <div>
            <label htmlFor="ailment-disclaimer" className="block font-bold text-red-700 mb-1">Medical Disclaimer *</label>
            <textarea 
              id="ailment-disclaimer"
              required
              value={formData.medicalDisclaimer}
              onChange={(e) => setFormData({...formData, medicalDisclaimer: e.target.value})}
              className="w-full p-2 border border-red-300 rounded bg-red-50"
              rows={3}
              placeholder="Warning text about consulting doctors..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">🚀 Quick Fill Templates</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  name: 'Anxiety',
                  category: 'mental-wellness',
                  description: 'A feeling of worry, nervousness, or unease about something with an uncertain outcome. Anxiety disorders involve repeated episodes of sudden feelings of intense anxiety and fear or terror that reach a peak within minutes (panic attacks).',
                  symptoms: 'Excessive worrying, Restlessness, Fatigue, Difficulty concentrating, Irritability, Muscle tension, Sleep problems, Racing heart'
                })}
                className="bg-white p-2 rounded border hover:bg-blue-100 text-left"
              >
                Fill: Anxiety
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  name: 'Stress',
                  category: 'mental-wellness',
                  description: 'Physical, mental, or emotional strain or tension resulting from adverse or demanding circumstances. Chronic stress can affect all systems of the body.',
                  symptoms: 'Headaches, Muscle tension, Chest pain, Fatigue, Stomach upset, Sleep problems, Irritability, Feeling overwhelmed'
                })}
                className="bg-white p-2 rounded border hover:bg-blue-100 text-left"
              >
                Fill: Stress
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  name: 'Insomnia',
                  category: 'mental-wellness',
                  description: 'Persistent problems falling and staying asleep. Insomnia can be caused by stress, irregular sleep schedules, poor sleeping habits, mental health disorders, and physical illnesses.',
                  symptoms: 'Difficulty falling asleep, Waking up during the night, Waking up too early, Daytime tiredness, Irritability, Difficulty paying attention'
                })}
                className="bg-white p-2 rounded border hover:bg-blue-100 text-left"
              >
                Fill: Insomnia
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  name: 'Depression',
                  category: 'mental-wellness',
                  description: 'A mood disorder that causes a persistent feeling of sadness and loss of interest. It affects how you feel, think and behave and can lead to a variety of emotional and physical problems.',
                  symptoms: 'Persistent sad mood, Loss of interest, Changes in appetite, Sleep disturbances, Fatigue, Feelings of worthlessness, Difficulty thinking'
                })}
                className="bg-white p-2 rounded border hover:bg-blue-100 text-left"
              >
                Fill: Depression
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-[#97A97C] text-white p-3 rounded font-bold hover:bg-[#7A8A63] disabled:opacity-50"
            >
              {loading ? '⏳ Saving...' : '💾 Save Ailment to Database'}
            </button>
            <Link href="/admin" className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-100">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}