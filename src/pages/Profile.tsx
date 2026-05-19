import { useAuth } from '../components/AuthProvider';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Gift, Award, Share2, LogOut, ChevronRight, Bookmark, Settings, CreditCard, ArrowLeft, Star, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProviderProfile } from '../lib/types';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoriteProviders, setFavoriteProviders] = useState<ProviderProfile[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    if (showFavorites && profile?.favorites?.length) {
      const fetchFavorites = async () => {
        setLoadingFavs(true);
        try {
          const q = query(collection(db, 'providers'), where('userId', 'in', profile.favorites));
          const snapshot = await getDocs(q);
          setFavoriteProviders(snapshot.docs.map(doc => doc.data() as ProviderProfile));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingFavs(false);
        }
      };
      fetchFavorites();
    }
  }, [showFavorites, profile?.favorites]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (e: any) {
      toast.error('Sign out failed');
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(profile?.referralCode || '');
    toast.success('Referral code copied!');
  };

  if (showFavorites) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 md:p-8 flex justify-center">
        <div className="max-w-2xl w-full space-y-6">
          <Button variant="ghost" className="gap-2" onClick={() => setShowFavorites(false)}>
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </Button>
          <h2 className="text-2xl font-bold">Saved Providers</h2>
          <div className="space-y-4">
            {loadingFavs ? (
              <p className="text-center text-neutral-500">Loading saved providers...</p>
            ) : favoriteProviders.length === 0 ? (
              <p className="text-center text-neutral-500 py-12">You haven't saved any providers yet.</p>
            ) : (
              favoriteProviders.map(p => (
                <Card key={p.userId} className="cursor-pointer hover:border-neutral-300 transition-colors" onClick={() => navigate('/')}>
                    <CardContent className="p-4 flex gap-4">
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center font-bold text-neutral-400">
                            {p.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-semibold">{p.name}</h3>
                                <div className="flex items-center text-sm font-medium">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                                    {p.rating}
                                </div>
                            </div>
                            <p className="text-xs text-neutral-500 capitalize">{p.category}</p>
                            <div className="flex items-center text-xs text-neutral-400 mt-2">
                                <MapPin className="w-3 h-3 mr-1" />
                                {p.location.address}
                            </div>
                        </div>
                    </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-6 pb-20 md:pb-0">
        <header className="flex items-center gap-4">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center text-2xl font-bold text-white uppercase">
            {profile?.displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{profile?.displayName}</h1>
            <p className="text-neutral-500 text-sm">{profile?.email}</p>
            <Badge className="mt-2 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 capitalize" variant="secondary">
              {profile?.role} Account
            </Badge>
          </div>
        </header>

        {/* Loyalty Section */}
        <Card className="bg-neutral-900 text-white overflow-hidden border-none shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="font-bold tracking-tight">Servi Points</span>
              </div>
              <Badge variant="outline" className="text-white border-white/20">Elite Member</Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold font-mono">{profile?.loyaltyPoints || 1240}</span>
              <span className="text-xs opacity-60">pts</span>
            </div>
            <div className="mt-6 flex gap-2">
              <Button className="flex-1 bg-white text-neutral-900 hover:bg-neutral-100">Redeem Points</Button>
              <Button variant="ghost" className="flex-1 text-white border border-white/20">View Tier</Button>
            </div>
          </CardContent>
          <div className="bg-white/5 h-2 w-full">
            <div className="h-full bg-yellow-500 w-3/4" />
          </div>
        </Card>

        {/* Referral Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invite Friends</CardTitle>
            <CardDescription>Share your code and you both get $10 when they book their first service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-neutral-100 p-3 rounded-lg font-mono font-bold text-center text-lg">
                {profile?.referralCode}
              </div>
              <Button size="icon" variant="outline" onClick={copyReferral}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col">
              <MenuItem 
                icon={Bookmark} 
                label="Saved Providers" 
                badge={profile?.favorites?.length}
                onClick={() => setShowFavorites(true)} 
              />
              <Separator />
              <MenuItem icon={CreditCard} label="Payment Methods" />
              <Separator />
              <MenuItem icon={Gift} label="Gift Cards & Promos" />
              <Separator />
              <MenuItem icon={Settings} label="App Settings" />
              <Separator />
              <button 
                onClick={handleSignOut}
                className="flex items-center justify-between p-4 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, badge }: { icon: any, label: string, onClick?: () => void, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center justify-between p-4 w-full text-left hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-neutral-400" />
        <span className="font-medium">{label}</span>
        {badge !== undefined && badge > 0 && (
          <Badge variant="secondary" className="ml-1 bg-neutral-100">{badge}</Badge>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-300" />
    </button>
  );
}
