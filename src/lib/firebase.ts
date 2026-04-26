import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  // Dummy student login as requested
  try {
    const dummyUser = {
      uid: 'dummy-student-id',
      email: 'student@example.com',
      displayName: 'Dummy Student',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
    };
    
    // In a real app we might still use Firebase, but for "dummy user" we just mock the result
    // To satisfy ProtectedRoute we might need a real-ish session or handle it in AuthContext
    // Let's actually use a real Firebase anonymous user or just mock if we don't care about persistence
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function loginAsDummyStudent() {
  // Mock student logic handled in AuthContext
}

export async function logout() {
  localStorage.removeItem('dummyUser');
  localStorage.removeItem('dummyAdmin');
  await signOut(auth);
}
