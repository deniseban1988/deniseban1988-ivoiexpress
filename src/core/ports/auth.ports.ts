import { UserAccount, AuthSession, UserRole } from '../../types';

export interface IAuthRepository {
  findUserByIdentifier(identifier: string): Promise<UserAccount | null>;
  findUserById(id: string): Promise<UserAccount | null>;
  getAllUsers(): Promise<UserAccount[]>;
  createUser(user: Partial<UserAccount>, password?: string): Promise<UserAccount>;
  updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount>;
  authenticate(identifier: string, password: string): Promise<UserAccount>;
  saveSession(session: AuthSession): Promise<void>;
  getActiveSession(): Promise<AuthSession | null>;
  clearSession(): Promise<void>;
}

export interface IAuthUseCase {
  login(identifier: string, password: string): Promise<{ session: AuthSession; redirectTab: string; message: string; requiresMfa?: boolean; tempMfaToken?: string }>;
  verifyMfaCode(tempMfaToken: string, code: string): Promise<{ session: AuthSession; redirectTab: string; message: string }>;
  requestPasswordReset(identifier: string): Promise<{ success: boolean; resetToken: string; message: string }>;
  confirmPasswordReset(identifier: string, resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }>;
  registerTraveler(fullName: string, email: string, phone: string, password: string): Promise<{ session: AuthSession; message: string }>;
  createUserAccountByAdmin(creatorRole: UserRole, newUser: Partial<UserAccount>): Promise<UserAccount>;
  logout(userRole: UserRole, userEmail: string): Promise<void>;
  logoutAllDevices(userEmail: string): Promise<{ count: number; message: string }>;
  getActiveSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<UserAccount | null>;
  getUsersList(userRole: UserRole): Promise<UserAccount[]>;
  toggleUserLockState(superAdminRole: UserRole, userId: string): Promise<UserAccount>;
}
