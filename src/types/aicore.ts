export type AIAssistantType = 
  | 'VOYAGEUR' 
  | 'TRANSPORT' 
  | 'HOTEL' 
  | 'VISION' 
  | 'IPTV' 
  | 'SUPER_ADMIN';

export type SmartActionType = 
  | 'RESERVATION_PROPOSAL' 
  | 'ITINERARY_SUGGESTION' 
  | 'HOTEL_RECOMMENDATION' 
  | 'CAMERA_CHECK_SUGGESTION' 
  | 'IPTV_RECOMMENDATION' 
  | 'SYSTEM_REPORT';

export interface AISmartAction {
  id: string;
  title: string;
  description: string;
  targetModule: 'Transport' | 'Hôtellerie' | 'Vision' | 'IPTV' | 'Paiement' | 'Notifications';
  actionType: SmartActionType;
  payload: Record<string, any>;
  requiresValidation: boolean;
  status: 'PROPOSED' | 'VALIDATED' | 'REJECTED' | 'EXECUTED';
  createdAt: string;
}

export interface AIMemoryEntry {
  id: string;
  userId?: string;
  key: string;
  value: string;
  category: 'PREFERENCE' | 'SEARCH_HISTORY' | 'FAVORITE' | 'BEHAVIOR_CONTEXT';
  updatedAt: string;
  isConfidential: boolean;
}

export interface TransversalServiceStatus {
  serviceId: string;
  name: string;
  iconName: string;
  status: 'Opérationnel' | 'Dégradé' | 'Hors-ligne' | 'En Maintenance';
  latencyMs: number;
  uptimePercent: number;
  lastCheck: string;
  description: string;
}

export interface SystemAnomaly {
  id: string;
  severity: 'CRITIQUE' | 'MOYENNE' | 'FAIBLE';
  module: string;
  title: string;
  aiDiagnostic: string;
  timestamp: string;
  status: 'DETECTE' | 'EN_COURS' | 'RESOLU';
  suggestedFix: string;
}

export interface TransversalPaymentTransaction {
  id: string;
  module: 'Transport' | 'Hôtellerie' | 'Autre';
  reference: string;
  amount: number;
  method: 'Wave' | 'MTN Mobile Money' | 'Orange Money' | 'Moov Money' | 'Carte Bancaire';
  status: 'Succès' | 'En attente' | 'Échec' | 'Remboursé';
  customerName: string;
  customerPhone: string;
  timestamp: string;
}

export interface TransversalNotificationLog {
  id: string;
  channel: 'PUSH' | 'EMAIL' | 'SMS';
  recipient: string;
  title: string;
  body: string;
  status: 'Envoyé' | 'En attente' | 'Échec';
  sentAt: string;
}

export interface AIAssistantConfig {
  type: AIAssistantType;
  name: string;
  avatarLabel: string;
  description: string;
  targetRole: string;
  systemPromptGoal: string;
  samplePrompts: string[];
  allowedActions: SmartActionType[];
  guardrails: string[];
}
