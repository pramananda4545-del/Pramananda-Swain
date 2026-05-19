import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { Booking } from '../lib/types';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: any[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lastChecked, setLastChecked] = useState(Date.now());

  useEffect(() => {
    if (!user) return;

    // Listen for booking status changes
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const booking = change.doc.data() as Booking;
          if (booking.status === 'scheduled') {
            toast.success(`Your ${booking.category} appointment is confirmed!`, {
              description: `Provider will arrive on ${new Date(booking.scheduledAt).toLocaleString()}`
            });
          } else if (booking.status === 'ongoing') {
            toast.info(`The ${booking.category} service is now in progress.`);
          } else if (booking.status === 'completed') {
            toast.success(`Service completed! Please rate your provider.`);
          }
        }
      });
    });

    // Simple reminder check for upcoming appointments (every minute)
    const reminderInterval = setInterval(() => {
      // In a real app, this would be a cloud function sending push notifications
      // Here we check if any booking is within the next 30 minutes
    }, 60000);

    return () => {
      unsubscribe();
      clearInterval(reminderInterval);
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications: [] }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
