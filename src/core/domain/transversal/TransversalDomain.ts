import { UserRole, AuditLog } from '../../../types';

export class TransversalDomain {
  /**
   * RBAC Permission Matrix Evaluation
   */
  static hasPermission(
    userRole: UserRole,
    requiredModule: 'Transport' | 'Hôtellerie' | 'Vision' | 'IPTV' | 'AICore' | 'SuperAdmin',
    action: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE'
  ): boolean {
    if ((userRole as string) === 'SUPER_ADMIN') return true;

    switch (requiredModule) {
      case 'Transport':
        if (userRole === 'ADMIN_AGENCE') return true;
        if (userRole === 'VOYAGEUR' && action === 'READ') return true;
        return false;

      case 'Hôtellerie':
        if (userRole === 'ADMIN_HOTEL') return true;
        if (userRole === 'VOYAGEUR' && action === 'READ') return true;
        return false;

      case 'Vision':
        if (userRole === 'ADMIN_AGENCE' || userRole === 'ADMIN_HOTEL') return true;
        if (userRole === 'VOYAGEUR' && action === 'READ') return true;
        return false;

      case 'IPTV':
        return true; // All authenticated roles can access IPTV stream

      case 'AICore':
        return true; // AI Assistant is role-adaptive

      case 'SuperAdmin':
        return (userRole as string) === 'SUPER_ADMIN';

      default:
        return false;
    }
  }

  /**
   * Format immutable financial audit log entry
   */
  static createAuditEntry(
    user: string,
    role: UserRole,
    action: string,
    module: 'Transport' | 'Hôtellerie' | 'Vision' | 'Sécurité' | 'RBAC' | 'Système',
    details: string,
    status: 'Succès' | 'Avertissement' | 'Refusé'
  ): AuditLog {
    return {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user,
      role,
      action,
      module,
      details,
      status,
      ipAddress: '197.239.12.88 (CI-Abidjan)'
    };
  }
}
