import { AIAssistantType, AISmartAction, AIMemoryEntry } from '../../types/aicore';
import { UserRole } from '../../types';

export interface IAICoreOrchestratorPort {
  queryAssistant(
    assistantType: AIAssistantType,
    prompt: string,
    userRole: UserRole,
    memories: AIMemoryEntry[]
  ): Promise<{ assistantName: string; reply: string; proposedAction?: AISmartAction }>;

  getSystemHealthDiagnostics(): Promise<{ globalStatus: string; score: number; summary: string }>;
}
