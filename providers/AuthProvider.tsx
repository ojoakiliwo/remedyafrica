'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'user' | 'admin' | 'practitioner';
  subscriptionTier?: 'free' | 'premium' | null;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData({ uid, ...userDoc.data() } as UserProfile);
      } else {
        const basicProfile: UserProfile = {
          uid,
          email: user?.email || '',
          displayName: user?.displayName || '',
          role: 'user',
          subscriptionTier: 'free',
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', uid), basicProfile);
        setUserData(basicProfile);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    }
  }, [user]);

  const refreshUserData = useCallback(async () => {
    if (user?.uid) {
      await fetchUserData(user.uid);
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await fetchUserData(userCredential.user.uid);
    }
  }, [fetchUserData]);

  const signup = useCallback(async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    const newUser: UserProfile = {
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      displayName: displayName || userCredential.user.displayName || '',
      role: 'user',
      subscriptionTier: 'free',
      createdAt: serverTimestamp(),
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
    setUserData(newUser);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  }, []);

  const value: AuthContextType = {
    user,
    userData,
    profile: userData,
    loading,
    login,
    signup,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}