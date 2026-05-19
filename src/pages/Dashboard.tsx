import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Booking, ProviderProfile } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, MapPin, Clock, CheckCircle, XCircle, Star, TrendingUp, Globe } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch provider specific profile
    const fetchProvider = async () => {
      try {
        const pDoc = await getDoc(doc(db, 'providers', user.uid));
        if (pDoc.exists()) {
          const data = pDoc.data() as ProviderProfile;
          setProviderProfile(data);
          
          // Auto-fix: if isVerified is true but status is not verified, sync it
          if (data.isVerified && data.verificationStatus !== 'verified') {
            await updateDoc(doc(db, 'providers', user.uid), { verificationStatus: 'verified' });
          }
        } else {
            // Initialize provider profile if missing
            const initialP: ProviderProfile = {
                userId: user.uid,
                name: profile?.displayName || 'Service Provider',
                category: 'mechanic',
                rating: 5.0,
                reviewCount: 0,
                location: { lat: 37.42, lng: -122.08, address: 'Global Tech Park, Bangalore' },
                availability: true,
                earnings: 0,
                isVerified: false,
                verificationStatus: 'none'
            };
            await setDoc(doc(db, 'providers', user.uid), initialP);
            setProviderProfile(initialP);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProvider();

    // Real-time bookings
    const q = query(collection(db, 'bookings'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookings'));

    return () => unsubscribe();
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      toast.success(`Booking ${status}`);
      
      if (status === 'completed') {
        // Update earnings
        const booking = bookings.find(b => b.id === bookingId);
        if (booking && providerProfile) {
            await updateDoc(doc(db, 'providers', user!.uid), {
                earnings: (providerProfile.earnings || 0) + booking.amount
            });
        }
      }
    } catch (error: any) {
      toast.error('Update failed: ' + error.message);
    }
  };

  const requestVerification = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'providers', user.uid), {
        verificationStatus: 'pending'
      });
      setProviderProfile(prev => prev ? { ...prev, verificationStatus: 'pending' } : null);
      toast.success('Verification request submitted! Our team will review your profile.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'providers');
    }
  };

  // For demo/testing: Function to approve itself
  const simulateApproval = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'providers', user.uid), {
        verificationStatus: 'verified',
        isVerified: true
      });
      setProviderProfile(prev => prev ? { ...prev, verificationStatus: 'verified', isVerified: true } : null);
      toast.success('Profile verified successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'providers');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const stats = [
    { label: 'Total Earnings', value: `$${providerProfile?.earnings || 0}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Rating', value: providerProfile?.rating || '5.0', icon: Star, color: 'text-yellow-600' },
    { label: 'Total Bookings', value: bookings.length, icon: trendingUp, color: 'text-blue-600' },
    { label: 'Status', value: providerProfile?.availability ? 'Active' : 'Offline', icon: CheckCircle, color: providerProfile?.availability ? 'text-green-500' : 'text-neutral-400' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Provider Dashboard</h1>
            <p className="text-neutral-500">Welcome back, {providerProfile?.name}</p>
          </div>
          <div className="flex gap-2">
            {!providerProfile?.isVerified && providerProfile?.verificationStatus !== 'pending' && (
              <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={requestVerification}>
                Request Verification
              </Button>
            )}
            {providerProfile?.verificationStatus === 'pending' && (
              <Button variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50" disabled>
                Verification Pending
              </Button>
            )}
            {providerProfile?.verificationStatus === 'pending' && (
                <Button variant="ghost" size="sm" className="text-[10px] opacity-50" onClick={simulateApproval}>
                    (Dev) Approve
                </Button>
            )}
            {providerProfile?.isVerified && (
              <Badge className="bg-blue-50 text-blue-600 flex items-center gap-1 border-blue-100 px-3 py-1">
                <CheckCircle className="w-3 h-3" /> Verified Pro
              </Badge>
            )}
            <Button variant="outline">Settings</Button>
            <Button className="bg-neutral-900 text-white">Go Offline</Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-neutral-100 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>Manage your incoming and active service requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-neutral-100 rounded-xl">
                  No bookings yet. Stay online to receive requests!
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-neutral-200 bg-white gap-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-lg font-bold text-neutral-400">
                        {(booking as any).customerName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-900">Request #{booking.id.slice(-6).toUpperCase()}</h4>
                          <Badge className="capitalize bg-neutral-100 text-neutral-600 hover:bg-neutral-200" variant="secondary">
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(booking.scheduledAt).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${booking.amount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="bg-neutral-900 text-white" onClick={() => updateBookingStatus(booking.id, 'scheduled')}>
                            Accept Request
                          </Button>
                        </>
                      )}
                      {booking.status === 'scheduled' && (
                        <Button size="sm" className="bg-neutral-900 text-white" onClick={() => updateBookingStatus(booking.id, 'ongoing')}>
                          Start Service
                        </Button>
                      )}
                      {booking.status === 'ongoing' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateBookingStatus(booking.id, 'completed')}>
                          Mark Completed
                        </Button>
                      )}
                      {(booking.status === 'completed' || booking.status === 'cancelled') && (
                        <Button variant="ghost" size="sm" disabled>View Details</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper icons fix
const trendingUp = TrendingUp;
const trendingDown = XCircle;
