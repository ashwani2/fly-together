import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  role: 'student' | 'admin' | null;
  loading: boolean;
  loginAsDummy?: () => void;
  loginAsAdminDummy?: (email: string) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  const loginAsDummy = () => {
    const dummyStudent = {
      uid: 'dummy-student-id',
      email: 'student@example.com',
      displayName: 'Dummy Student',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    };
    setUser(dummyStudent as any);
    setRole('student');
    localStorage.setItem('dummyUser', JSON.stringify(dummyStudent));
  };

  const loginAsAdminDummy = (email: string) => {
    const dummyAdmin = {
      uid: 'dummy-admin-id',
      email: email,
      displayName: 'System Admin',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    };
    setUser(dummyAdmin as any);
    setRole('admin');
    localStorage.setItem('dummyAdmin', JSON.stringify(dummyAdmin));
  };

  useEffect(() => {
    try {
      const savedDummy = localStorage.getItem('dummyUser');
      const savedAdmin = localStorage.getItem('dummyAdmin');

      if (savedAdmin) {
        setUser(JSON.parse(savedAdmin));
        setRole('admin');
        setLoading(false);
        return;
      }

      if (savedDummy) {
        setUser(JSON.parse(savedDummy));
        setRole('student');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Failed to parse saved user from localStorage', e);
      localStorage.removeItem('dummyUser');
      localStorage.removeItem('dummyAdmin');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          if (user.email === 'ashwani.kumar1406@gmail.com' || user.email === 'admin@email.com') {
            setRole('admin');
          } else {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setRole(userDoc.data().role);
            } else {
              setRole('student');
            }
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth state processing error:", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    // Final safety to prevent infinite loading if firebase is slow
    const safetyTimeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("Auth loading timed out, forcing complete.");
        return false;
      });
    }, 8000);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, loginAsDummy, loginAsAdminDummy }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
