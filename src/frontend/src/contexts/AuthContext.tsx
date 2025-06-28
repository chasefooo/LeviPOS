import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Hub } from '@aws-amplify/core';
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: any;
    groups: string[];
    setUser: (user: any) => void;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [groups, setGroups] = useState<string[]>([]);

    // Define refreshUser that updates both user and groups.
    const refreshUser = async () => {
        try {
            // Retrieve the current user using getCurrentUser for existing logic.
            const currentUser = await getCurrentUser();
            console.debug('getCurrentUser:', currentUser);

            // Use fetchAuthSession to retrieve the JWT payload and extract groups.
            const session = await fetchAuthSession();
            console.debug('fetchAuthSession:', session);
            const token = session?.tokens?.idToken;
            if (!token) {
                console.log("No token found in auth session.");
                setGroups([]);
            } else {
                const payload = token.payload;
                console.debug("JWT payload:", payload);
                const rawGroups = payload['cognito:groups'];
                let groupsFromPayload: string[] = [];
                if (Array.isArray(rawGroups)) {
                    groupsFromPayload = rawGroups.filter(item => typeof item === 'string');
                } else if (typeof rawGroups === 'string') {
                    groupsFromPayload = [rawGroups];
                }
                setGroups(groupsFromPayload);
            }
            setUser(currentUser);
        } catch (error) {
            console.debug('No current authenticated user:', error);
            setUser(null);
            setGroups([]);
        }
    };

    useEffect(() => {
        console.debug('AuthProvider mounting, checking current user...');
        refreshUser();

        const listener = (data: any) => {
            const { event } = data.payload;
            console.debug('Auth Hub event:', event);
            if (event === 'signIn') {
                refreshUser();
            } else if (event === 'signOut') {
                setUser(null);
                setGroups([]);
            }
        };

        const unsubscribe = Hub.listen('auth', listener);
        return () => {
            unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
            setUser(null);
            setGroups([]);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, groups, setUser, signOut: handleSignOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};