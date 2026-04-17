'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  subscriptionTier?: string;
  photoURL?: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName = userData.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: displayName,
              role: userData.role || 'user',
              subscriptionTier: userData.subscriptionTier || 'free',
              photoURL: userData.photoURL || firebaseUser.photoURL,
            });
            setIsAdmin(userData.role === 'admin' || userData.isAdmin === true);
          } else {
            const defaultDisplayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
            const newUserData = {
              email: firebaseUser.email,
              displayName: defaultDisplayName,
              role: 'user',
              subscriptionTier: 'free',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUserData);
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: defaultDisplayName,
              role: 'user',
              subscriptionTier: 'free',
              photoURL: firebaseUser.photoURL,
            });
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setProfile(null);
          setIsAdmin(false);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    const finalDisplayName = displayName || email.split('@')[0];
    await updateProfile(newUser, { displayName: finalDisplayName });
    
    await setDoc(doc(db, 'users', newUser.uid), {
      email: newUser.email,
      displayName: finalDisplayName,
      role: 'user',
      subscriptionTier: 'free',
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signIn, signUp, logout }}>
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