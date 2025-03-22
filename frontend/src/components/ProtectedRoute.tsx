import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
          setIsAuthorized(false);
          return;
        }

        const user = JSON.parse(userData);
        
        // Kullanıcının rolü izin verilen roller arasında mı kontrol et
        if (allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
        } else {
          // Admin kullanıcısı tables sayfasına erişmeye çalışıyorsa admin paneline yönlendir
          if (user.role === 'admin' && location.pathname === '/tables') {
            window.location.href = '/admin';
            return;
          }
          // Garson kullanıcısı admin paneline erişmeye çalışıyorsa masalar sayfasına yönlendir
          if (user.role === 'waiter' && location.pathname === '/admin') {
            window.location.href = '/tables';
            return;
          }
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Yetkilendirme hatası:', error);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [allowedRoles, location.pathname]);

  if (isAuthorized === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 