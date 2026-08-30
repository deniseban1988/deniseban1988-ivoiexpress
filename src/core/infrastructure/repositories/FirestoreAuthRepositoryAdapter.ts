import { db, auth } from '../../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { IAuthRepository } from '../../ports/auth.ports';
import { UserAccount, AuthSession } from '../../../types';

const SESSION_STORAGE_KEY = 'ivx_active_session_cloud_v1';

export class FirestoreAuthRepositoryAdapter implements IAuthRepository {
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) {
        try {
          this.currentSession = JSON.parse(storedSession);
        } catch {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    }
  }

  async findUserByIdentifier(identifier: string): Promise<UserAccount | null> {
    const q = query(
      collection(db, 'users'),
      where('email', '==', identifier.trim().toLowerCase())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserAccount;
    }

    // Fallback search by phone if needed, but Firebase Auth uses email
    return null;
  }

  async findUserById(id: string): Promise<UserAccount | null> {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserAccount;
    }
    return null;
  }

  async getAllUsers(): Promise<UserAccount[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as UserAccount);
  }

  async authenticate(identifier: string, password: string): Promise<UserAccount> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      const uid = userCredential.user.uid;
      const userProfile = await this.findUserById(uid);
      
      if (!userProfile) {
        throw new Error("Compte d'authentification valide, mais profil utilisateur introuvable dans la base de données.");
      }
      
      return userProfile;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Identifiant ou mot de passe incorrect.");
      }
      throw error;
    }
  }

  async createUser(userData: Partial<UserAccount>, password?: string): Promise<UserAccount> {
    let uid = userData.id;

    // If password provided, it means we're creating a real Firebase Auth account
    if (password && userData.email) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
        uid = userCredential.user.uid;
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          throw new Error("Un compte d'authentification existe déjà avec cet e-mail.");
        }
        throw error;
      }
    }

    if (!uid) {
       throw new Error("Impossible de créer l'utilisateur : UID manquant.");
    }

    const newUser: UserAccount = {
      id: uid,
      fullName: userData.fullName || 'Utilisateur IVOIReXpress',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'VOYAGEUR',
      status: userData.status || 'ACTIVE',
      agencyId: userData.agencyId,
      agencyName: userData.agencyName,
      hotelId: userData.hotelId,
      hotelName: userData.hotelName,
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, updates);
    const updated = await this.findUserById(id);
    if (!updated) throw new Error("Utilisateur introuvable après mise à jour.");
    
    if (this.currentSession && this.currentSession.user.id === id) {
      this.currentSession.user = updated;
      await this.saveSession(this.currentSession);
    }
    return updated;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.currentSession = session;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }

  async getActiveSession(): Promise<AuthSession | null> {
    return this.currentSession;
  }

  async clearSession(): Promise<void> {
    this.currentSession = null;
    await signOut(auth);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }
}
