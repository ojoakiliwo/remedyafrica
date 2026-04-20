'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { collection, query, getDocs, doc, getDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: number;
  specialty: string;
  bio: string;
  certifications: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  photoURL?: string;
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check admin status - STRICT: Only role === 'admin' gets access
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // STRICT: Only role === 'admin' is admin. 
          // Practitioners (role === 'practitioner') are NOT admins.
          const adminStatus = userData.role === 'admin';
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            toast.error('Access denied - Admin only');
            router.push('/');
            return;
          }
        } else {
          toast.error('User not found');
          router.push('/');
          return;
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        router.push('/');
        return;
      }
      
      fetchApplications();
    };

    checkAdmin();
  }, [user, router]);

  const fetchApplications = async () => {
    try {
      const q = query(
        collection(db, 'practitioner_applications'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const data: Application[] = [];
      
      for (const docSnap of snapshot.docs) {
        const raw = docSnap.data();
        // FIX: Ensure certifications is always an array
        const certs = raw.certifications;
        const safeCerts = Array.isArray(certs) ? certs : [];
        
        data.push({
          id: docSnap.id,
          name: raw.name || 'Unknown',
          email: raw.email || '',
          phone: raw.phone || '',
          location: raw.location || '',
          experience: raw.experience || 0,
          specialty: raw.specialty || 'General',
          bio: raw.bio || '',
          certifications: safeCerts,
          status: raw.status || 'pending',
          createdAt: raw.createdAt?.toDate() || new Date(),
          photoURL: raw.photoURL || ''
        });
      }
      
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: Application) => {
    setProcessing(application.id);
    try {
      // Create practitioner document
      await updateDoc(doc(db, 'practitioners', application.id), {
        name: application.name,
        email: application.email,
        phone: application.phone,
        location: application.location,
        experience: application.experience,
        specialty: application.specialty,
        bio: application.bio,
        certifications: application.certifications || [],
        photoURL: application.photoURL || '',
        isVerified: true,
        isActive: true,
        rating: 0,
        reviews: 0,
        consultationFee: 0,
        createdAt: new Date(),
        applicationId: application.id
      });

      // Update application status
      await updateDoc(doc(db, 'practitioner_applications', application.id), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user?.uid
      });

      toast.success(`Application approved for ${application.name}`);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    setProcessing(applicationId);
    try {
      await updateDoc(doc(db, 'practitioner_applications', applicationId), {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: user?.uid
      });

      toast.success('Application rejected');
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await deleteDoc(doc(db, 'practitioner_applications', applicationId));
      toast.success('Application deleted');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7c6b]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e4df]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#2c3e33]">Practitioner Applications</h1>
                <p className="text-sm text-[#5a5a5a]">
                  {pendingApps.length} pending • {approvedApps.length} approved • {rejectedApps.length} rejected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-[#e8e4df]">
            <FileText className="h-12 w-12 text-[#d4cfc7] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2c3e33]">No Applications</h3>
            <p className="text-sm text-[#5a5a5a]">No practitioner applications have been submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Applications */}
            {pendingApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#2c3e33] mb-4 flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700">{pendingApps.length}</Badge>
                  Pending Applications
                </h2>
                <div className="space-y-4">
                  {pendingApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onApprove={() => handleApprove(app)}
                      onReject={() => handleReject(app.id)}
                      onDelete={() => handleDelete(app.id)}
                      processing={processing === app.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Approved Applications */}
            {approvedApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#2c3e33] mb-4 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">{approvedApps.length}</Badge>
                  Approved
                </h2>
                <div className="space-y-4">
                  {approvedApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onApprove={() => {}}
                      onReject={() => handleReject(app.id)}
                      onDelete={() => handleDelete(app.id)}
                      processing={processing === app.id}
                      showActions={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Applications */}
            {rejectedApps.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#2c3e33] mb-4 flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-700">{rejectedApps.length}</Badge>
                  Rejected
                </h2>
                <div className="space-y-4">
                  {rejectedApps.map((app) => (
                    <ApplicationCard 
                      key={app.id} 
                      application={app} 
                      onApprove={() => handleApprove(app)}
                      onReject={() => {}}
                      onDelete={() => handleDelete(app.id)}
                      processing={processing === app.id}
                      showActions={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Application Card Component
function ApplicationCard({ 
  application, 
  onApprove, 
  onReject, 
  onDelete,
  processing,
  showActions = true
}: { 
  application: Application;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  processing: boolean;
  showActions?: boolean;
}) {
  // FIX: Ensure certifications is always an array before using .map()
  const certifications = application.certifications || [];
  
  return (
    <Card className="border-[#e8e4df]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#5c7c6b]/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-[#5c7c6b]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2c3e33]">{application.name}</h3>
                <Badge className={
                  application.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  application.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-[#5a5a5a]">
                <Mail className="h-4 w-4" />
                {application.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5a5a5a]">
                <Phone className="h-4 w-4" />
                {application.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5a5a5a]">
                <MapPin className="h-4 w-4" />
                {application.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5a5a5a]">
                <FileText className="h-4 w-4" />
                {application.experience} years experience
              </div>
            </div>

            <p className="text-sm text-[#5a5a5a] mb-3">
              <span className="font-medium">Specialty:</span> {application.specialty}
            </p>

            <p className="text-sm text-[#5a5a5a] line-clamp-3 mb-3">
              {application.bio}
            </p>

            {/* FIX: Safe check - ensure certifications exists and has items before mapping */}
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {certifications.map((cert, idx) => (
                  <span key={idx} className="text-xs bg-[#f0efe9] px-2 py-1 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={onApprove}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={onReject}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-red-600"
                onClick={onDelete}
                disabled={processing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}