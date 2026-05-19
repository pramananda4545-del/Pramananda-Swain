import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProviderProfile, Category } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Star, MapPin, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface ProviderListProps {
  category?: Category | 'all';
  onSelectProvider: (provider: ProviderProfile) => void;
  onProvidersFetched?: (providers: ProviderProfile[]) => void;
}

export default function ProviderList({ category, onSelectProvider, onProvidersFetched }: ProviderListProps) {
  const { user, profile } = useAuth();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleFavorite = async (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to save favorites');
      return;
    }

    const isFavorite = profile?.favorites?.includes(providerId);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        favorites: isFavorite ? arrayRemove(providerId) : arrayUnion(providerId)
      });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorites');
    }
  };

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true);
      try {
        let q = query(collection(db, 'providers'), limit(10));
        if (category && category !== 'all') {
            q = query(collection(db, 'providers'), where('category', '==', category), limit(10));
        }
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as ProviderProfile);
        setProviders(data);
        onProvidersFetched?.(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'providers');
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, [category]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-neutral-100 animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
      {providers.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">No providers found in this category.</div>
      ) : (
        providers.map((p) => (
          <Card key={p.userId} className="overflow-hidden hover:border-neutral-400 transition-colors cursor-pointer" onClick={() => onSelectProvider(p)}>
            <div className="flex p-4 gap-4">
              <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center text-2xl font-bold text-neutral-400 uppercase">
                {p.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <Badge variant="secondary" className="mt-1 capitalize">{p.category}</Badge>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center text-sm font-medium">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                      {p.rating.toFixed(1)} ({p.reviewCount})
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-neutral-100"
                      onClick={(e) => toggleFavorite(e, p.userId)}
                    >
                      <Heart 
                        className={`w-5 h-5 ${profile?.favorites?.includes(p.userId) ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`} 
                      />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center mt-3 text-sm text-neutral-500">
                  <MapPin className="w-4 h-4 mr-1 text-neutral-400" />
                  {p.location.address}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" className="bg-neutral-900 text-white">Book Now</Button>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
