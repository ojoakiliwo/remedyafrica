'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { effectiveAccountRole } from '@/lib/auth/roles';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: any;
  name?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  userData: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toProfile(
  firebaseUser: FirebaseUser,
  data: Record<string, any> | undefined,
  hasPractitionerProfile: boolean
): UserProfile {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: data?.displayName || firebaseUser.displayName,
    photoURL: data?.photoURL || firebaseUser.photoURL,
    role: effectiveAccountRole(data?.role, hasPractitionerProfile),
    subscriptionTier: data?.subscriptionTier,
    subscriptionStatus: data?.subscriptionStatus,
    subscriptionExpiresAt: data?.subscriptionExpiresAt,
    name: data?.name,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser = () => {};
    let unsubPractitioner = () => {};

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubUser();
      unsubPractitioner();
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      let userData: Record<string, any> | undefined;
      let hasPractitionerProfile = false;
      let sawUserDoc = false;
      let sawPractitionerDoc = false;
      let ensuringProfile = false;

      const publish = () => {
        if (!sawUserDoc || !sawPractitionerDoc) return;
        setProfile(toProfile(firebaseUser, userData, hasPractitionerProfile));
        setLoading(false);
      };

      unsubUser = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        async (userDoc) => {
          sawUserDoc = true;
          if (userDoc.exists()) {
            userData = userDoc.data();
          } else if (!ensuringProfile) {
            ensuringProfile = true;
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                name: firebaseUser.displayName,
                role: 'user',
                subscriptionTier: 'free',
                subscriptionStatus: 'inactive',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }, { merge: true });
            } catch (error) {
              console.error('Error creating missing user profile:', error);
              userData = undefined;
            }
          }
          publish();
        },
        (error) => {
          console.error('Error listening to user profile:', error);
          sawUserDoc = true;
          publish();
        }
      );

      unsubPractitioner = onSnapshot(
        doc(db, 'practitioners', firebaseUser.uid),
        (practitionerDoc) => {
          sawPractitionerDoc = true;
          hasPractitionerProfile = practitionerDoc.exists();
          publish();
        },
        (error) => {
          console.error('Error listening to practitioner profile:', error);
          sawPractitionerDoc = true;
          publish();
        }
      );
    });

    return () => {
      unsubscribe();
      unsubUser();
      unsubPractitioner();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, { displayName });
    await userCredential.user.reload();
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName,
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setUser({ ...userCredential.user });
    setProfile({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName,
      photoURL: null,
      role: 'user',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, userData: profile, loading, login, signup, logout }}>
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
