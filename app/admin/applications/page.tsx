'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  Trash2,
  Shield,
  Eye,
  ExternalLink,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { toast } from 'sonner';

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  experience: number | string;
  specialty: string;
  bio: string;
  certifications: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  photoURL?: string;
  userId?: string;
  governmentIdURL?: string;
  governmentIdType?: string;
  governmentIdNumber?: string;
  agreeToTerms?: boolean;
  agreeToBackgroundCheck?: boolean;
  notes?: string;
  whyJoin?: string;
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id: 'National ID Card',
  passport: 'International Passport',
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
};

function idTypeLabel(value?: string) {
  if (!value) return 'Not provided';
  return ID_TYPE_LABELS[value] || value.replace(/_/g, ' ');
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
      const snapshot = await getDocs(collection(db, 'practitioner_applications'));
      const data: Application[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();
        const certs = raw.certifications;
        const safeCerts = Array.isArray(certs)
          ? certs
          : typeof certs === 'string'
            ? certs.split(',').map((item: string) => item.trim()).filter(Boolean)
            : [];

        return {
          id: docSnap.id,
          name: raw.name || raw.fullName || 'Unknown',
          email: raw.email || raw.applicantEmail || '',
          phone: raw.phone || '',
          location: raw.location || '',
          experience: raw.experience ?? 0,
          specialty: raw.specialty || 'General',
          bio: raw.bio || '',
          certifications: safeCerts,
          status: raw.status || 'pending',
          createdAt: raw.createdAt?.toDate?.() || raw.submittedAt?.toDate?.() || new Date(),
          photoURL: raw.photoURL || '',
          userId: raw.userId || '',
          governmentIdURL: raw.governmentIdURL || '',
          governmentIdType: raw.governmentIdType || '',
          governmentIdNumber: raw.governmentIdNumber || '',
          agreeToTerms: raw.agreeToTerms === true,
          agreeToBackgroundCheck: raw.agreeToBackgroundCheck === true,
          notes: raw.notes || '',
          whyJoin: raw.whyJoin || '',
        };
      });

      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      const idToken = await user?.getIdToken();
      if (idToken) {
        const response = await fetch('/api/admin/applications/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ applicationId: application.id }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          toast.success(`Approved ${application.name}. Their existing login is now a practitioner account.`);
          fetchApplications();
          return;
        }
        if (response.status !== 503) {
          throw new Error(payload.error || 'Failed to approve application');
        }
      }

      const practitionerId = application.userId || application.id;
      await setDoc(doc(db, 'practitioners', practitionerId), {
        name: application.name,
        email: application.email,
        phone: application.phone,
        location: application.location,
        experience: Number.parseInt(String(application.experience), 10) || 0,
        specialty: application.specialty,
        bio: application.bio,
        certifications: application.certifications || [],
        photoURL: application.photoURL || '',
        isVerified: true,
        isActive: true,
        rating: 0,
        reviews: 0,
        consultationFee: 0,
        createdAt: serverTimestamp(),
        applicationId: application.id,
        userId: application.userId || null,
      }, { merge: true });

      await updateDoc(doc(db, 'practitioner_applications', application.id), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user?.uid,
      });

      if (application.userId) {
        try {
          await setDoc(doc(db, 'users', application.userId), {
            role: 'practitioner',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (roleError) {
          console.warn('Could not set practitioner role on user profile', roleError);
        }
      }

      toast.success(`Application approved for ${application.name}`);
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error?.message || 'Failed to approve application');
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
                      onApprove={() => { }}
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
                      onReject={() => { }}
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const certifications = application.certifications || [];

  return (
    <>
      <Card className="border-[#e8e4df]">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#5c7c6b]/10 flex items-center justify-center shrink-0">
                  {application.photoURL ? (
                    <img src={application.photoURL} alt={`Photo of ${application.name}`} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-[#5c7c6b]" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2c3e33]">{application.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge className={
                      application.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        application.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                    }>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {application.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm text-[#5a5a5a]">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{application.email || 'No email'}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{application.phone || 'No phone'}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{application.location || 'No location'}</div>
                <div className="flex items-center gap-2"><FileText className="h-4 w-4" />{application.experience} years • {application.specialty}</div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className={`px-2 py-1 rounded-full ${application.photoURL ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  Photo {application.photoURL ? 'uploaded' : 'missing'}
                </span>
                <span className={`px-2 py-1 rounded-full ${application.governmentIdURL ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  ID {application.governmentIdURL ? 'uploaded' : 'missing'}
                </span>
                <span className="px-2 py-1 rounded-full bg-[#f0efe9] text-[#5a5a5a]">
                  {idTypeLabel(application.governmentIdType)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                className="bg-[#5c7c6b] hover:bg-[#4a6354] text-white"
                onClick={() => setReviewOpen(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Review details
              </Button>
              {showActions && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={onApprove}
                    disabled={processing}
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Approve</>}
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
                </>
              )}
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review application</DialogTitle>
            <DialogDescription>
              Inspect every submitted field and document before you approve or reject this healer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <section className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Profile photo</p>
                {application.photoURL ? (
                  <a href={application.photoURL} target="_blank" rel="noreferrer" className="block">
                    <img src={application.photoURL} alt={`Profile photo of ${application.name}`} className="w-full max-w-xs rounded-lg object-cover border" />
                  </a>
                ) : (
                  <p className="text-gray-500">No profile photo uploaded.</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Government ID</p>
                {application.governmentIdURL ? (
                  <a href={application.governmentIdURL} target="_blank" rel="noreferrer" className="block">
                    <img src={application.governmentIdURL} alt="Uploaded government ID" className="w-full max-w-xs rounded-lg object-cover border" />
                  </a>
                ) : (
                  <p className="text-gray-500">No ID document uploaded.</p>
                )}
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-3">
              <Detail label="Full name" value={application.name} />
              <Detail label="Email" value={application.email} />
              <Detail label="Phone" value={application.phone} />
              <Detail label="Location" value={application.location} />
              <Detail label="Specialty" value={application.specialty} />
              <Detail label="Years of experience" value={String(application.experience)} />
              <Detail label="ID type" value={idTypeLabel(application.governmentIdType)} />
              <Detail label="ID number" value={application.governmentIdNumber || 'Not provided'} />
              <Detail label="Submitted" value={application.createdAt.toLocaleString()} />
            </section>

            <section>
              <p className="font-medium text-[#2c3e33] mb-1">Bio</p>
              <p className="whitespace-pre-wrap text-[#5a5a5a]">{application.bio || 'Not provided'}</p>
            </section>

            {application.whyJoin && (
              <section>
                <p className="font-medium text-[#2c3e33] mb-1">Why they want to join</p>
                <p className="whitespace-pre-wrap text-[#5a5a5a]">{application.whyJoin}</p>
              </section>
            )}

            {application.notes && (
              <section>
                <p className="font-medium text-[#2c3e33] mb-1">Notes</p>
                <p className="whitespace-pre-wrap text-[#5a5a5a]">{application.notes}</p>
              </section>
            )}

            <section>
              <p className="font-medium text-[#2c3e33] mb-2">Certifications & training</p>
              {certifications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {certifications.map((cert, idx) => (
                    <span key={idx} className="text-xs bg-[#f0efe9] px-2 py-1 rounded-full">{cert}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">None provided</p>
              )}
            </section>

            <section className="rounded-lg bg-amber-50 border border-amber-100 p-3 space-y-1">
              <p className="font-medium text-[#2c3e33] flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                Consents
              </p>
              <p>{application.agreeToTerms ? 'Agreed to practitioner terms of service' : 'Did not record terms agreement'}</p>
              <p>{application.agreeToBackgroundCheck ? 'Consented to background / ID verification' : 'Did not record background-check consent'}</p>
            </section>

            {(application.photoURL || application.governmentIdURL) && (
              <div className="flex flex-wrap gap-3">
                {application.photoURL && (
                  <a href={application.photoURL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#5c7c6b] hover:underline">
                    <ExternalLink className="h-4 w-4" /> Open photo
                  </a>
                )}
                {application.governmentIdURL && (
                  <a href={application.governmentIdURL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#5c7c6b] hover:underline">
                    <ExternalLink className="h-4 w-4" /> Open ID document
                  </a>
                )}
              </div>
            )}

            {showActions && (
              <div className="flex gap-3 pt-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => { setReviewOpen(false); onApprove(); }}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" />Approve after review</>}
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => { setReviewOpen(false); onReject(); }}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-[#2c3e33] break-words">{value || 'Not provided'}</p>
    </div>
  );
}