import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Booking, ProviderProfile } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Clock, Phone, MessageSquare, CreditCard, ChevronLeft, Star, Video, Mic, Globe } from 'lucide-react';
import ServiceMap from '../components/ServiceMap';

export default function BookingDetails() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStep, setPaymentStep] = useState(false);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'bookings', id), async (snapshot) => {
      if (snapshot.exists()) {
        const bData = { id: snapshot.id, ...snapshot.data() } as Booking;
        setBooking(bData);
        
        // Fetch provider info
        const pDoc = await getDoc(doc(db, 'providers', bData.providerId));
        if (pDoc.exists()) {
          setProvider(pDoc.data() as ProviderProfile);
        }
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `bookings/${id}`));

    return () => unsubscribe();
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'bookings', id), { status: 'cancelled' });
      toast.success('Booking cancelled');
    } catch (error: any) {
      toast.error('Failed to cancel: ' + error.message);
    }
  };

  const handlePayment = async (method: string) => {
    if (!id) return;
    try {
      // Simulation of payment processing
      await updateDoc(doc(db, 'bookings', id), { 
        paymentStatus: 'paid',
        paymentMethod: method
      });
      toast.success(`Payment via ${method} successful!`);
      setPaymentStep(false);
    } catch (error: any) {
      toast.error('Payment failed: ' + error.message);
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    setActiveCall(type);
    toast.info(`Starting ${type} call with ${provider?.name}...`);
  };

  const submitRating = async (rating: number) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'bookings', id), { rating });
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      toast.error('Failed to submit rating');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!booking) return <div className="p-8 text-center text-red-500">Booking not found</div>;

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-neutral-100 text-neutral-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const currencySymbol = booking.currency === 'USD' ? '$' : booking.currency === 'INR' ? '₹' : booking.currency === 'EUR' ? '€' : booking.currency;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row h-screen overflow-hidden">
      {/* Sidebar Info */}
      <div className="w-full md:w-96 bg-white border-r border-neutral-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <Button variant="ghost" className="self-start -ml-2" onClick={() => navigate('/')}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Explore
        </Button>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Badge className={getStatusColor(booking.status)} variant="secondary">{booking.status}</Badge>
            <span className="text-xs text-neutral-500">#{id?.slice(-6).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{booking.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Service</h1>
          <p className="text-sm text-neutral-500 mt-1">Provider: {provider?.name || 'Loading...'}</p>
        </div>

        <div className="space-y-4 py-4 border-y border-neutral-100">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-neutral-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Scheduled For</p>
              <p className="text-sm text-neutral-500">{new Date(booking.scheduledAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-neutral-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Service Location</p>
              <p className="text-sm text-neutral-500">{provider?.location.address}</p>
            </div>
          </div>
        </div>

        {provider && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-xl font-bold text-neutral-400">
                {provider.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold">{provider.name}</p>
                    {provider.isVerified && <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[10px] h-4">Verified</Badge>}
                </div>
                <div className="flex items-center text-xs text-neutral-500">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                  {provider.rating} • {provider.reviewCount} reviews
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => startCall('voice')}><Mic className="w-4 h-4 mr-2" /> Voice</Button>
              <Button variant="outline" size="sm" onClick={() => startCall('video')}><Video className="w-4 h-4 mr-2" /> Video</Button>
              <Button variant="outline" size="sm" className="col-span-2"><MessageSquare className="w-4 h-4 mr-2" /> Message Provider</Button>
            </div>
          </div>
        )}

        {booking.status === 'completed' && booking.paymentStatus === 'unpaid' && (
          <div className="mt-auto pt-6 border-t border-neutral-100 space-y-4">
            <div className="flex justify-between items-center bg-neutral-900 text-white p-4 rounded-xl">
              <div>
                <p className="text-xs opacity-70">Total Amount</p>
                <p className="text-xl font-bold font-mono">{currencySymbol}{booking.amount}</p>
              </div>
              <Button variant="outline" className="text-neutral-900 bg-white hover:bg-neutral-100 border-none" onClick={() => setPaymentStep(true)}>
                Pay Now
              </Button>
            </div>
          </div>
        )}

        {booking.status === 'completed' && booking.paymentStatus === 'paid' && !booking.rating && (
          <div className="mt-auto pt-6 border-t border-neutral-100">
            <p className="text-sm font-semibold mb-3">Rate your experience</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => submitRating(star)} className="hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-neutral-200 hover:text-yellow-400 fill-current" />
                </button>
              ))}
            </div>
          </div>
        )}

        {(booking.status === 'pending' || booking.status === 'scheduled') && (
          <div className="mt-auto flex gap-2 pt-6 border-t border-neutral-100">
            <Button variant="ghost" className="flex-1 text-red-600" onClick={handleCancel}>Cancel</Button>
            <Button variant="outline" className="flex-1">Reschedule</Button>
          </div>
        )}
      </div>

      {/* Main Area (Map/Payment/Call) */}
      <div className="flex-1 relative">
        <ServiceMap 
          providers={provider ? [provider] : []} 
          center={provider?.location}
          zoom={15}
        />
        
        {/* Real-time Status Overlay */}
        {booking.status === 'ongoing' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <div className="bg-white rounded-2xl p-4 shadow-xl border border-neutral-200 flex items-center gap-4">
              <div className="relative">
                <div className="animate-ping absolute inset-0 bg-green-500 rounded-full opacity-20" />
                <div className="w-4 h-4 bg-green-500 rounded-full relative" />
              </div>
              <p className="font-semibold text-sm">Service is currently in progress...</p>
            </div>
          </div>
        )}

        {/* Call Overlay Overlay */}
        {activeCall && (
            <div className="absolute inset-4 bg-neutral-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white z-40 border border-neutral-800">
                <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center text-3xl font-bold uppercase mb-6 animate-pulse">
                    {provider?.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold">{activeCall === 'video' ? 'Video calling...' : 'Voice calling...'}</h3>
                <p className="text-neutral-400 mt-2">{provider?.name}</p>
                
                {activeCall === 'video' && (
                    <div className="absolute bottom-4 right-4 w-32 h-44 bg-neutral-800 rounded-lg border border-neutral-700 flex items-center justify-center text-xs text-neutral-500">
                        Camera preview
                    </div>
                )}

                <div className="absolute bottom-12 flex gap-4">
                    <Button variant="destructive" className="rounded-full w-14 h-14" onClick={() => setActiveCall(null)}>
                        <Phone className="w-6 h-6 rotate-[135deg]" />
                    </Button>
                </div>
            </div>
        )}

        {/* Payment Modal/Overlay */}
        {paymentStep && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Payment Gateway</CardTitle>
                    <Globe className="w-5 h-5 text-neutral-400" />
                </div>
                <CardDescription>International payments supported via multi-currency gateway.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-4 bg-neutral-50 rounded-xl mb-4 border border-neutral-100">
                    <p className="text-sm text-neutral-500">Payable Amount</p>
                    <p className="text-3xl font-bold">{currencySymbol}{booking.amount}</p>
                </div>

                <Button variant="outline" className="w-full justify-between h-14" onClick={() => handlePayment('Card')}>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5" /> 
                    <div className="text-left">
                        <p className="font-semibold text-sm">International Card</p>
                        <p className="text-[10px] text-neutral-500">VISA, Mastercard, Amex</p>
                    </div>
                   </div>
                  <span className="text-xs text-neutral-400">Secure</span>
                </Button>
                
                <Button variant="outline" className="w-full justify-between h-14" onClick={() => handlePayment('Local')}>
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5" /> 
                    <div className="text-left">
                        <p className="font-semibold text-sm">Local Payment Method</p>
                        <p className="text-[10px] text-neutral-500">UPI, NetBanking, AliPay, etc.</p>
                    </div>
                   </div>
                </Button>
              </CardContent>
              <div className="p-6 pt-0">
                 <Button variant="ghost" className="w-full" onClick={() => setPaymentStep(false)}>Cancel</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
