import { PaymentMethod, UserRole, AuditLog } from '../../types';

export interface IPaymentGatewayPort {
  processPayment(
    module: 'Transport' | 'Hôtellerie' | 'Vision' | 'IPTV',
    amount: number,
    method: PaymentMethod,
    customerName: string,
    customerPhone: string
  ): Promise<{ success: boolean; reference: string; message: string }>;
}

export interface INotificationPort {
  sendNotification(
    channel: 'PUSH' | 'EMAIL' | 'SMS',
    recipient: string,
    title: string,
    body: string
  ): Promise<{ success: boolean; notificationId: string }>;
}

export interface IAuditLoggerPort {
  logAction(
    user: string,
    role: UserRole,
    action: string,
    module: 'Transport' | 'Hôtellerie' | 'Vision' | 'Sécurité' | 'RBAC' | 'Système',
    details: string,
    status: 'Succès' | 'Avertissement' | 'Refusé'
  ): Promise<AuditLog>;

  getAuditLogs(): Promise<AuditLog[]>;
  getLogs(filterModule?: string): Promise<AuditLog[]>;
}
