import { UserAccount, UserRole } from '../../../types';

export class AuthDomain {
  /**
   * Maximum failed login attempts before locking account
   */
  static MAX_FAILED_ATTEMPTS = 5;

  /**
   * Validate Email or Phone input format
   */
  static validateIdentifier(identifier: string): { valid: boolean; error?: string } {
    if (!identifier || identifier.trim().length === 0) {
      return { valid: false, error: "Veuillez saisir votre e-mail ou votre numéro de téléphone." };
    }
    const clean = identifier.trim();
    const isEmail = clean.includes('@') && clean.includes('.');
    const isPhone = /^[0-9+ \-()]{8,15}$/.test(clean);

    if (!isEmail && !isPhone) {
      return { valid: false, error: "Identifiant invalide. Entrez un e-mail valide ou un numéro (ex: 0707070707)." };
    }
    return { valid: true };
  }

  /**
   * Validate Password complexity
   */
  static validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { valid: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
    }
    return { valid: true };
  }

  /**
   * Evaluate Brute-Force lockout condition
   */
  static isAccountLocked(account: UserAccount): boolean {
    if (account.isLocked) return true;
    if (account.failedLoginAttempts >= this.MAX_FAILED_ATTEMPTS) return true;
    return false;
  }

  /**
   * Determine redirect workspace route based on authenticated role
   */
  static getRedirectWorkspace(role: UserRole): { defaultTab: string; label: string } {
    switch (role) {
      case 'SUPER_ADMIN':
        return { defaultTab: 'superadmin', label: 'Console Nationale Super Admin' };
      case 'ADMIN_AGENCE':
        return { defaultTab: 'agency', label: 'Espace Administration Agence' };
      case 'ADMIN_HOTEL':
        return { defaultTab: 'hotel', label: 'Portail Gestionnaire Hôtelier' };
      case 'VOYAGEUR':
      default:
        return { defaultTab: 'home', label: 'Espace Voyageur IVOIReXpress' };
    }
  }

  /**
   * Enforce account creation permissions (RBAC for Auth)
   */
  static canCreateUserRole(creatorRole: UserRole | 'ANONYMOUS', targetRole: UserRole): { allowed: boolean; error?: string } {
    if (targetRole === 'VOYAGEUR') {
      return { allowed: true }; // Self-registration allowed
    }
    if (creatorRole !== 'SUPER_ADMIN') {
      return {
        allowed: false,
        error: `Accès refusé. Les comptes "${targetRole}" ne peuvent être créés que par le Super Admin.`
      };
    }
    return { allowed: true };
  }
}
