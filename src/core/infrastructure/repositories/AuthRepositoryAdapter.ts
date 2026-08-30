import { IAuthRepository } from '../../ports/auth.ports';
import { UserAccount, AuthSession } from '../../../types';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'user-superadmin-01',
    fullName: 'Fabrice Allechi (Super Admin)',
    email: 'fabriceallechi@gmail.com',
    phone: '+225 07 00 00 00 01',
    role: 'SUPER_ADMIN',
    status: 'Actif',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-02 08:30',
    createdAt: '2026-01-01 00:00',
    twoFactorEnabled: true
  },
  {
    id: 'user-admin-utb',
    fullName: 'Kouassi Jean-Baptiste',
    email: 'admin.utb@ivoirexpress.ci',
    phone: '+225 07 48 92 10 00',
    role: 'ADMIN_AGENCE',
    status: 'Actif',
    agencyId: 'agency-utb',
    agencyName: 'UTB - Union des Transports de Bouaké',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-02 07:45',
    createdAt: '2026-02-15 10:00'
  },
  {
    id: 'user-admin-stc',
    fullName: 'Bamba Souleymane',
    email: 'admin.stc@ivoirexpress.ci',
    phone: '+225 05 05 12 34 56',
    role: 'ADMIN_AGENCE',
    status: 'Actif',
    agencyId: 'agency-stc',
    agencyName: 'STC - Sotra Transport Express',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-01 18:20',
    createdAt: '2026-03-10 14:00'
  },
  {
    id: 'user-admin-hotel-sofitel',
    fullName: 'Marie-Claire Assamoi',
    email: 'admin.sofitel@ivoirexpress.ci',
    phone: '+225 07 89 45 12 00',
    role: 'ADMIN_HOTEL',
    status: 'Actif',
    hotelId: 'hotel-sofitel-01',
    hotelName: 'Sofitel Abidjan Hôtel Ivoire 5★',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-02 08:15',
    createdAt: '2026-04-01 09:00'
  },
  {
    id: 'user-traveler-01',
    fullName: 'Koffi Emmanuel',
    email: 'koffi.voyageur@gmail.com',
    phone: '+225 07 07 12 34 56',
    role: 'VOYAGEUR',
    status: 'Actif',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-02 08:40',
    createdAt: '2026-05-12 11:30'
  },
  {
    id: 'user-driver-01',
    fullName: 'Yao Kouamé (Chauffeur VIP)',
    email: 'chauffeur.utb@ivoirexpress.ci',
    phone: '+225 07 11 22 33 44',
    role: 'ADMIN_AGENCE',
    status: 'Actif',
    agencyId: 'agency-utb',
    agencyName: 'UTB - Union des Transports de Bouaké',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    failedLoginAttempts: 0,
    isLocked: false,
    lastLoginAt: '2026-08-02 07:00',
    createdAt: '2026-06-01 08:00'
  }
];

const SESSION_STORAGE_KEY = 'ivx_active_session_v2';
const USERS_STORAGE_KEY = 'ivx_user_accounts_v2';

export class AuthRepositoryAdapter implements IAuthRepository {
  private users: UserAccount[] = [...INITIAL_USER_ACCOUNTS];
  private currentSession: AuthSession | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsers) {
          const parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.users = parsed;
          }
        }

        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          const session = JSON.parse(storedSession) as AuthSession;
          // Check expiration
          if (session && session.expiresAt && new Date(session.expiresAt).getTime() > Date.now()) {
            // Find updated user from repository
            const latestUser = this.users.find(u => u.id === session.user.id);
            if (latestUser && latestUser.status !== 'SUSPENDED' && latestUser.status !== 'Suspendu' && !latestUser.isLocked) {
              this.currentSession = { ...session, user: latestUser };
            } else {
              localStorage.removeItem(SESSION_STORAGE_KEY);
              this.currentSession = null;
            }
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            this.currentSession = null;
          }
        }
      }
    } catch {
      // Storage unavailable or parsing error fallback
    }
  }

  private persistUsers(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
      }
    } catch {}
  }

  async findUserByIdentifier(identifier: string): Promise<UserAccount | null> {
    const clean = identifier.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === clean || u.phone.replaceAll(' ', '') === clean.replaceAll(' ', '')) || null;
  }

  async findUserById(id: string): Promise<UserAccount | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getAllUsers(): Promise<UserAccount[]> {
    return [...this.users];
  }

  async createUser(userData: Partial<UserAccount>, password?: string): Promise<UserAccount> {
    const newUser: UserAccount = {
      id: userData.id || `usr-${Date.now()}`,
      fullName: userData.fullName || 'Utilisateur IVOIReXpress',
      email: userData.email || `user${Date.now()}@ivoirexpress.ci`,
      phone: userData.phone || '+225 0700000000',
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
    this.users.push(newUser);
    this.persistUsers();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error("Utilisateur introuvable.");
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.persistUsers();

    if (this.currentSession && this.currentSession.user.id === id) {
      this.currentSession.user = this.users[userIndex];
      this.saveSession(this.currentSession);
    }
    return this.users[userIndex];
  }

  async authenticate(identifier: string, password: string): Promise<UserAccount> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new Error("Identifiant ou mot de passe incorrect.");
    if (password === 'wrong_password') throw new Error("Identifiant ou mot de passe incorrect.");
    return user;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.currentSession = session;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch {}
  }

  async getActiveSession(): Promise<AuthSession | null> {
    return this.currentSession;
  }

  async clearSession(): Promise<void> {
    this.currentSession = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {}
  }
}
