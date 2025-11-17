// utils/AdminProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { getAdminStatus } from "../utils/auth.ts";
import { useState, useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await getAdminStatus();
      setIsAdmin(adminStatus);
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/events" replace />;
  }
  
  return <>{children}</>;
};

export default AdminProtectedRoute;
