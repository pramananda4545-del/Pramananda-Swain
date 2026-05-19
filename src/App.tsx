/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { NotificationProvider } from "./components/NotificationProvider";
import { Toaster } from "./components/ui/sonner";
import AuthPage from "./pages/Auth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import BookingDetails from "./pages/BookingDetails";
import Profile from "./pages/Profile";

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
      <Route 
        path="/" 
        element={user ? (profile?.role === 'provider' ? <Dashboard /> : <Home />) : <Navigate to="/auth" />} 
      />
      <Route path="/booking/:id" element={user ? <BookingDetails /> : <Navigate to="/auth" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster position="top-center" />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

