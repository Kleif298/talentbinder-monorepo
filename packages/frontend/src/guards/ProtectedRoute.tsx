// utils/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { getUserData } from "../utils/auth.ts";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const userData = await getUserData();
      setUser(userData);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    console.log('❌ No user data - redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('✅ User authenticated - rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
