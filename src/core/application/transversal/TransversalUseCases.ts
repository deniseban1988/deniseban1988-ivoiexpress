import { IPaymentGatewayPort, INotificationPort, IAuditLoggerPort } from '../../ports/transversal.ports';
import { TransversalDomain } from '../../domain/transversal/TransversalDomain';
import { PaymentMethod, UserRole, AuditLog } from '../../../types';

export class TransversalUseCases {
  constructor(
    private paymentGateway: IPaymentGatewayPort,
    private notificationPort: INotificationPort,
    private auditLoggerPort: IAuditLoggerPort
  ) {}

  async processUnifiedPayment(
    module: 'Transport' | 'Hôtellerie' | 'Vision' | 'IPTV',
    amount: number,
    method: PaymentMethod,
    customerName: string,
    customerPhone: string,
    userRole: UserRole
  ) {
    const res = await this.paymentGateway.processPayment(module, amount, method, customerName, customerPhone);
    if (res.success) {
      const mappedModule = module === 'IPTV' ? 'Système' : module;
      await this.auditLoggerPort.logAction(
        customerName,
        userRole,
        'PAIEMENT_HUB_TRANSVERSAL',
        mappedModule,
        `Encaissement de ${amount} FCFA via ${method} (Réf: ${res.reference}).`,
        'Succès'
      );
    }
    return res;
  }

  async dispatchMultiChannelNotification(
    channel: 'PUSH' | 'EMAIL' | 'SMS',
    recipient: string,
    title: string,
    body: string,
    userRole: UserRole
  ) {
    if (!TransversalDomain.hasPermission(userRole, 'SuperAdmin', 'EXECUTE') && userRole !== 'ADMIN_AGENCE' && userRole !== 'ADMIN_HOTEL') {
      throw new Error("Droit d'émission de notification multi-canal refusé.");
    }

    const res = await this.notificationPort.sendNotification(channel, recipient, title, body);

    await this.auditLoggerPort.logAction(
      `User-${userRole}`,
      userRole,
      'DIFFUSION_NOTIFICATION_MULTICANAL',
      'Système',
      `Notification ${channel} envoyée à "${recipient}" : "${title}".`,
      'Succès'
    );

    return res;
  }

  async getAuditTrail(userRole: UserRole): Promise<AuditLog[]> {
    if (!TransversalDomain.hasPermission(userRole, 'SuperAdmin', 'READ')) {
      throw new Error("Accès strictly restreint au registre d'audit financier et RBAC.");
    }
    return this.auditLoggerPort.getAuditLogs();
  }
}
