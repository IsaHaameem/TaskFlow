'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import useRouter and usePathname
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();

    // This effect runs on initial load to check for an existing token
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decoded = jwtDecode(storedToken);
                setUser({ id: decoded.id });
                setToken(storedToken);
            } catch (error) {
                console.error("Invalid token found, clearing storage.");
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    // --- NEW: This effect handles all redirection logic ---
    useEffect(() => {
        if (loading) return; // Wait until the initial loading is done

        const isAuthPage = pathname === '/login' || pathname === '/signup';

        // If the user is logged in but is on an auth page, redirect to dashboard
        if (user && isAuthPage) {
            router.push('/dashboard');
        }

        // If the user is not logged in and tries to access a protected page, redirect to login
        if (!user && !isAuthPage) {
            router.push('/login');
        }

    }, [user, loading, pathname, router]);


    const loginAction = async (credentials) => {
        try {
            const res = await fetch('http://localhost:5001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });
            const data = await res.json();
            if (data.success) {
                const decoded = jwtDecode(data.token);
                setUser({ id: decoded.id }); // This state change will trigger the redirect effect
                setToken(data.token);
                localStorage.setItem('token', data.token);
                return { success: true };
            } else {
                return { success: false, message: data.msg };
            }
        } catch (error) {
            return { success: false, message: 'Login failed due to a network error.' };
        }
    };

    const logoutAction = () => {
        setToken(null);
        setUser(null); // This state change will trigger the redirect effect
        localStorage.removeItem('token');
    };

    const value = { token, user, loading, loginAction, logoutAction };

    // We only render children once the initial loading is complete
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
