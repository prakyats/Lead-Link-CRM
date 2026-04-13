import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1120' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ border: '4px solid rgba(0,212,170,0.2)', borderTopColor: '#00D4AA' }}></div>
                    <p className="mt-4" style={{ color: '#94A3B8' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        if (user.role === 'MANAGER') {
            return <Navigate to="/team-insights" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
