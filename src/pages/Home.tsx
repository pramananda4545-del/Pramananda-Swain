import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import ProviderList from '../components/ProviderList';
import ServiceMap from '../components/ServiceMap';
import { Category, ProviderProfile } from '../lib/types';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Map as MapIcon, List, Bell, User as UserIcon, Calendar, Gift, Users } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Doctors', value: 'doctor' },
  { label: 'Plumbers', value: 'plumber' },
  { label: 'Electricians', value: 'electrician' },
  { label: 'Salons', value: 'salon' },
  { label: 'Cleaners', value: 'cleaner' },
  { label: 'Mechanics', value: 'mechanic' },
  { label: 'Travel Agents', value: 'travel_agent' },
];

export default function Home() {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const [providers, setProviders] = useState<ProviderProfile[]>([]);

  const handleBookProvider = async (provider: ProviderProfile) => {
    try {
      // For demo, creating a pending booking
      const bookingData = {
        customerId: user?.uid,
        providerId: provider.userId,
        category: provider.category,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'pending',
        amount: 50.00,
        currency: 'USD',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      toast.success('Booking initiated!');
      navigate(`/booking/${docRef.id}`);
    } catch (error: any) {
      toast.error('Failed to book: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center text-white font-bold leading-none">S</div>
            <h1 className="text-xl font-bold tracking-tight">Servi</h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                className="pl-10 bg-neutral-100 border-none rounded-full" 
                placeholder="Search for services..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <UserIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Sidebar / Filters */}
        <aside className="w-full lg:w-64 flex flex-col gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 px-1">Categories</h2>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <Button 
                variant={selectedCategory === 'all' ? 'default' : 'ghost'} 
                className="justify-start rounded-full lg:rounded-md bg-neutral-900"
                onClick={() => setSelectedCategory('all')}
              >
                All Services
              </Button>
              {CATEGORIES.map(cat => (
                <Button 
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'ghost'} 
                  className={`justify-start rounded-full lg:rounded-md ${selectedCategory === cat.value ? 'bg-neutral-900 text-white' : ''}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 text-white p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-yellow-500">
              <Gift className="w-5 h-5" />
              <span className="font-bold">Servi Gold</span>
            </div>
            <p className="text-sm text-neutral-300">Get 15% off on all services with subscription.</p>
            <Button className="w-full bg-white text-neutral-900 border-none hover:bg-neutral-200">Upgrade</Button>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-2 text-neutral-900">
              <Users className="w-5 h-5" />
              <span className="font-bold text-sm">Refer & Earn</span>
            </div>
            <p className="text-xs text-neutral-500">Share your code <span className="font-mono font-bold">{profile?.referralCode}</span> and get $10.</p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold capitalize">
              {selectedCategory === 'all' ? 'Featured Services' : `${selectedCategory}s near you`}
            </h2>
            <div className="flex items-center border border-neutral-200 rounded-lg p-1 bg-white">
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="gap-2"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" /> List
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="gap-2"
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-4 h-4" /> Map
              </Button>
            </div>
          </div>

          <div className="relative min-h-[500px]">
            {viewMode === 'list' ? (
              <ProviderList 
                category={selectedCategory} 
                onSelectProvider={handleBookProvider} 
                onProvidersFetched={setProviders}
              />
            ) : (
              <div className="absolute inset-0">
                <ServiceMap providers={providers} onSelectProvider={handleBookProvider} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden bg-white border-t border-neutral-200 p-2 flex justify-around items-center sticky bottom-0">
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2">
          <Search className="w-5 h-5 text-neutral-900" />
          <span className="text-[10px]">Explore</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => navigate('/bookings')}>
          <Calendar className="w-5 h-5 text-neutral-500" />
          <span className="text-[10px]">Bookings</span>
        </Button>
        <Button variant="ghost" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => navigate('/profile')}>
          <UserIcon className="w-5 h-5 text-neutral-500" />
          <span className="text-[10px]">Account</span>
        </Button>
      </nav>
    </div>
  );
}
