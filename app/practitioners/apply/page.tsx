// app/practitioners/apply/page.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { uploadPractitionerApplicationFile } from '@/lib/firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { 
  Upload, 
  X, 
  Check, 
  Loader2,
  FileText,
  Shield,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PractitionerApplyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    specialty: '',
    experience: '',
    bio: '',
    certifications: '',
    agreeToTerms: false,
    agreeToBackgroundCheck: false,
    governmentIdType: 'national_id' as 'national_id' | 'passport' | 'drivers_license' | 'voters_card',
    governmentIdNumber: ''
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  
  const photoRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => prev.email ? prev : { ...prev, email: user.email || '' });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleIdSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image of your ID');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ID image must be under 5MB');
      return;
    }
    
    setIdDocument(file);
    const reader = new FileReader();
    reader.onloadend = () => setIdPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit a practitioner application');
      router.push('/login');
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error('You must agree to the Terms of Service');
      return;
    }
    
    if (!formData.agreeToBackgroundCheck) {
      toast.error('You must consent to background verification');
      return;
    }
    
    if (!photo) {
      toast.error('Please upload a profile photo');
      return;
    }
    
    if (!idDocument) {
      toast.error('Please upload your government-issued ID');
      return;
    }
    
    if (!formData.governmentIdNumber.trim()) {
      toast.error('Please enter your ID number');
      return;
    }

    setLoading(true);

    try {
      const photoResult = await uploadPractitionerApplicationFile(photo, user.uid, 'photo');
      const idResult = await uploadPractitionerApplicationFile(idDocument, user.uid, 'id');

      const certifications = formData.certifications
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      await addDoc(collection(db, 'practitioner_applications'), {
        ...formData,
        name: formData.fullName,
        certifications,
        userId: user.uid,
        applicantEmail: user.email || formData.email,
        photoURL: photoResult.url,
        photoPath: photoResult.path,
        governmentIdURL: idResult.url,
        governmentIdPath: idResult.path,
        status: 'pending',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      });

      setSubmitted(true);
      toast.success('Application submitted! We will review within 5 business days.');
    } catch (error: any) {
      console.error('Submit error:', error);
      const message = error?.code === 'storage/unauthorized'
        ? 'Your account does not have permission to upload practitioner files. Sign in and try again.'
        : (error.message || 'Failed to submit application');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-forest mb-2">Sign in to apply</h2>
          <p className="text-gray-600 mb-6">
            Create or sign in to your RemedyAfrica account before submitting a practitioner application.
          </p>
          <Link href="/login">
            <Button className="bg-forest hover:bg-forest-mist">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-forest mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application is under review. We will verify your credentials and government ID within 5 business days.
          </p>
          <Link href="/">
            <Button className="bg-forest hover:bg-forest-mist">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-forest text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-bronze hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Apply as a Practitioner</h1>
          <p className="text-gray-300 mt-2">
            Join our network of verified traditional healers. Get paid monthly based on subscribers you serve.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-bronze" />
              Personal Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-forest mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Dr. Amina Okafor"
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="amina@example.com"
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="+234 800 000 0000"
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Location *</label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Lagos, Nigeria"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-bronze" />
              Professional Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-forest mb-1">Specialty *</label>
                <input
                  type="text"
                  name="specialty"
                  required
                  value={formData.specialty}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Herbal Medicine, Bone Setting, Midwifery..."
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Years of Experience *</label>
                <input
                  type="number"
                  name="experience"
                  required
                  min="1"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Bio *</label>
                <textarea
                  name="bio"
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Tell us about your healing practice, training, and approach..."
                />
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">Certifications & Training</label>
                <textarea
                  name="certifications"
                  rows={2}
                  value={formData.certifications}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Traditional healing school, apprenticeship, certifications..."
                />
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-bronze" />
              Profile Photo *
            </h2>
            
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-forest">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    aria-label="Remove profile photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-forest"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Photo</span>
                </button>
              )}
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                aria-label="Upload profile photo"
              />
              <p className="text-sm text-gray-500">Professional headshot. Max 5MB.</p>
            </div>
          </div>

          {/* Government ID Verification */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-amber-100">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Identity Verification *
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              We require government-issued ID to verify your identity and protect our community. 
              Your ID is stored securely and only used for verification purposes.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="governmentIdType" className="block font-medium text-forest mb-1">ID Type *</label>
                <select
                  id="governmentIdType"
                  name="governmentIdType"
                  value={formData.governmentIdType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                >
                  <option value="national_id">National ID Card</option>
                  <option value="passport">International Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="voters_card">Voter's Card</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-forest mb-1">ID Number *</label>
                <input
                  type="text"
                  name="governmentIdNumber"
                  required
                  value={formData.governmentIdNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
                  placeholder="Enter your ID number"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {idPreview ? (
                <div className="relative w-40 h-28 rounded-lg overflow-hidden border-2 border-forest">
                  <img src={idPreview} alt="ID" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setIdDocument(null); setIdPreview(null); }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    aria-label="Remove ID document"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => idRef.current?.click()}
                  className="w-40 h-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-forest"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Upload ID</span>
                </button>
              )}
              <input
                ref={idRef}
                type="file"
                accept="image/*"
                onChange={handleIdSelect}
                className="hidden"
                aria-label="Upload government ID document"
              />
              <div className="text-sm text-gray-500">
                <p>Clear photo of your ID</p>
                <p>Front side only</p>
                <p>Max 5MB</p>
              </div>
            </div>
          </div>

          {/* Legal Agreement */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-blue-100">
            <h2 className="text-xl font-bold text-forest mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Legal Agreement
            </h2>
            
            <div className="space-y-4 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4">
              <h3 className="font-bold text-forest">Terms of Service for Practitioners</h3>
              
              <p><strong>1. Verification & Compliance</strong></p>
              <p>You confirm that all information provided is accurate. You consent to background verification including identity confirmation through government-issued ID. Providing false information will result in immediate termination and potential legal action.</p>
              
              <p><strong>2. Scope of Practice</strong></p>
              <p>You agree to practice within your training and expertise. You will not claim to provide services beyond your qualifications. You understand that RemedyAfrica is a platform connecting traditional healers with seekers and does not provide medical advice.</p>
              
              <p><strong>3. Patient Safety</strong></p>
              <p>You agree to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Refer users to licensed medical professionals when appropriate</li>
                <li>Not discourage users from seeking conventional medical care</li>
                <li>Maintain confidentiality of all user interactions</li>
                <li>Report any adverse reactions to herbal preparations</li>
              </ul>
              
              <p><strong>4. Product Sales</strong></p>
              <p>You may sell herbal preparations through the platform. You confirm that all products are prepared safely and labeled accurately. RemedyAfrica takes 15% commission on product sales. You are responsible for product quality and shipping.</p>
              
              <p><strong>5. Payment Structure</strong></p>
              <p>You will be paid monthly based on the number of subscribers who consulted with you. The base rate is determined by your tier and subscriber volume. Payments are processed within 5 business days of month-end.</p>
              
              <p><strong>6. Platform Rules</strong></p>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Solicit users for off-platform payments</li>
                <li>Share user contact information</li>
                <li>Make guarantees of cure or specific outcomes</li>
                <li>Discriminate against any user</li>
              </ul>
              
              <p><strong>7. Termination</strong></p>
              <p>Either party may terminate with 30 days notice. RemedyAfrica may terminate immediately for violations of these terms, patient safety concerns, or fraudulent activity.</p>
              
              <p><strong>8. Liability</strong></p>
              <p>You acknowledge that you are an independent practitioner, not an employee of RemedyAfrica. You carry full liability for your practice and advice. RemedyAfrica provides the platform only and is not liable for practitioner actions.</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-bronze rounded focus:ring-[#97A97C]"
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the <strong>Terms of Service</strong> above. I understand that providing false information or violating these terms may result in account termination and legal consequences.
                </span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToBackgroundCheck"
                  checked={formData.agreeToBackgroundCheck}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 text-bronze rounded focus:ring-[#97A97C]"
                />
                <span className="text-sm text-gray-700">
                  I consent to <strong>background verification</strong> including identity confirmation through my government-issued ID. I understand this is required for community safety.
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-forest hover:bg-forest-mist h-14 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
            <Link href="/">
              <Button type="button" variant="outline" className="h-14 px-8">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}