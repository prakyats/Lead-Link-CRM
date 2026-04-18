import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import api from '../utils/api';

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    organizationId?: number;
    organizationSlug?: string;
    managerId?: number | null;
    hasTeam?: boolean;
}


interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (organizationSlug: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('authToken');

            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (organizationSlug: string, email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { organizationSlug, email, password });
            const payload = response.data?.data ?? response.data;
            const token = payload?.token;
            const userData = payload?.user;

            if (!token || !userData) {
                throw new Error('Invalid login response');
            }

            // Store token and user data
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
            throw new Error(message);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/';
    }, []);

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
