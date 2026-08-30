import { IAICoreOrchestratorPort } from '../../ports/aicore.ports';
import { IAuditLoggerPort } from '../../ports/transversal.ports';
import { AIAssistantType, AISmartAction, AIMemoryEntry } from '../../../types/aicore';
import { UserRole } from '../../../types';

export class AICoreUseCases {
  constructor(
    private orchestratorAdapter: IAICoreOrchestratorPort,
    private auditLogger: IAuditLoggerPort
  ) {}

  async handleAssistantQuery(
    assistantType: AIAssistantType,
    prompt: string,
    userRole: UserRole,
    memories: AIMemoryEntry[]
  ) {
    const response = await this.orchestratorAdapter.queryAssistant(assistantType, prompt, userRole, memories);

    // AI Core always writes audit logs when generating smart action proposals
    if (response.proposedAction) {
      await this.auditLogger.logAction(
        `AI-Core-${assistantType}`,
        userRole,
        'PROPOSITION_ACTION_INTELLIGENTE',
        'Système',
        `Proposition de l'AI Core: "${response.proposedAction.title}" pour le module ${response.proposedAction.targetModule}. (Validation requise)`,
        'Avertissement'
      );
    }

    return response;
  }

  async getHealthStatus() {
    return this.orchestratorAdapter.getSystemHealthDiagnostics();
  }
}
