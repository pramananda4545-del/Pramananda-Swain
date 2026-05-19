export type Role = 'customer' | 'provider' | 'admin';
export type Category = 'doctor' | 'plumber' | 'electrician' | 'salon' | 'cleaner' | 'mechanic' | 'travel_agent';
export type BookingStatus = 'pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  favorites?: string[];
  subscriptionActive: boolean;
  subscriptionType?: string;
  createdAt: string;
}

export interface ProviderProfile {
  userId: string;
  name: string;
  category: Category;
  rating: number;
  reviewCount: number;
  location: Location;
  availability: boolean;
  earnings: number;
  isVerified: boolean;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  category: Category;
  scheduledAt: string;
  status: BookingStatus;
  amount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  trackingLocation?: Location;
  rating?: number;
  review?: string;
  createdAt: string;
}

export interface GiftCard {
  code: string;
  amount: number;
  isUsed: boolean;
  usedBy?: string;
}
