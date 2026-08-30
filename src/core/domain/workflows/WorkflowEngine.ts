import { DomainEventBus } from '../events/DomainEvents';

export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type WorkflowType =
  | 'WORKFLOW_1_TRANSPORT_BOOKING'
  | 'WORKFLOW_2_HOTEL_BOOKING'
  | 'WORKFLOW_3_CREATE_AGENCY'
  | 'WORKFLOW_4_CREATE_HOTEL'
  | 'WORKFLOW_5_PAYMENT_ENGINE'
  | 'WORKFLOW_6_VISION_AI_ALERT'
  | 'WORKFLOW_7_IPTV_ACTIVATION'
  | 'WORKFLOW_8_NOTIFICATION_ROUTING'
  | 'WORKFLOW_9_AICORE_ANALYSIS'
  | 'WORKFLOW_10_SUPERVISION_RECOVERY';

export interface IWorkflowStep {
  id: string;
  stepNumber: number;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  details?: string;
  completedAt?: string;
  errorDetails?: string;
}

export interface IWorkflowInstance {
  id: string;
  title: string;
  type: WorkflowType;
  status: WorkflowStatus;
  tenantId?: string;
  tenantType?: 'AGENCY' | 'HOTEL' | 'GLOBAL';
  initiatedBy: string;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  currentStepIndex: number;
  steps: IWorkflowStep[];
  data: Record<string, any>;
  errorReason?: string;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private workflows: Map<string, IWorkflowInstance> = new Map();
  private listeners: Array<(workflows: IWorkflowInstance[]) => void> = [];

  private constructor() {
    this.seedInitialWorkflows();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  public subscribe(listener: (workflows: IWorkflowInstance[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getAllWorkflows());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const list = this.getAllWorkflows();
    this.listeners.forEach(l => l(list));
  }

  public getAllWorkflows(): IWorkflowInstance[] {
    return Array.from(this.workflows.values()).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public getWorkflowsByTenant(tenantId?: string, tenantType?: 'AGENCY' | 'HOTEL' | 'GLOBAL'): IWorkflowInstance[] {
    return this.getAllWorkflows().filter(wf => {
      if (!tenantId || tenantId === 'GLOBAL') return true;
      return wf.tenantId === tenantId || wf.tenantType === 'GLOBAL';
    });
  }

  /**
   * CRÉATION ET EXÉCUTION EN TEMPS RÉEL D'UN WORKFLOW
   */
  public async executeWorkflow(
    type: WorkflowType,
    params: {
      initiatedBy: string;
      tenantId?: string;
      tenantType?: 'AGENCY' | 'HOTEL' | 'GLOBAL';
      customData?: Record<string, any>;
      simulateFailureAtStep?: number;
    }
  ): Promise<IWorkflowInstance> {
    const steps = this.getWorkflowStepsTemplate(type);
    const wfId = `wf-${type.toLowerCase()}-${Date.now().toString().slice(-6)}`;
    const startTime = Date.now();

    const instance: IWorkflowInstance = {
      id: wfId,
      title: this.getWorkflowTitle(type),
      type,
      status: 'IN_PROGRESS',
      tenantId: params.tenantId || 'GLOBAL',
      tenantType: params.tenantType || 'GLOBAL',
      initiatedBy: params.initiatedBy,
      startedAt: new Date().toISOString(),
      currentStepIndex: 0,
      steps,
      data: params.customData || {}
    };

    this.workflows.set(wfId, instance);
    this.notify();

    // Déclenchement asynchrone des étapes de workflow
    this.runStepsSequentially(wfId, startTime, params.simulateFailureAtStep);

    return instance;
  }

  private async runStepsSequentially(wfId: string, startTime: number, failAtStep?: number): Promise<void> {
    const wf = this.workflows.get(wfId);
    if (!wf) return;

    for (let i = 0; i < wf.steps.length; i++) {
      wf.currentStepIndex = i;
      wf.steps[i].status = 'IN_PROGRESS';
      this.notify();

      // Simulation de temps d'exécution réel (150ms par étape)
      await new Promise(res => setTimeout(res, 180));

      if (failAtStep && wf.steps[i].stepNumber === failAtStep) {
        wf.steps[i].status = 'FAILED';
        wf.steps[i].errorDetails = `Erreur réseau ou échec transactionnel simulé à l'étape ${failAtStep}`;
        wf.status = 'FAILED';
        wf.errorReason = `Étape ${failAtStep} (${wf.steps[i].title}) a échoué.`;
        wf.completedAt = new Date().toISOString();
        wf.executionTimeMs = Date.now() - startTime;
        
        // Publication événement échec au DomainEventBus
        DomainEventBus.getInstance().publish({
          type: 'PaymentFailed',
          emitterModule: 'AUDIT',
          tenantId: wf.tenantId,
          payload: { workflowId: wf.id, reason: wf.errorReason }
        });

        this.notify();
        return;
      }

      wf.steps[i].status = 'COMPLETED';
      wf.steps[i].completedAt = new Date().toISOString();
      this.notify();
    }

    wf.status = 'COMPLETED';
    wf.completedAt = new Date().toISOString();
    wf.executionTimeMs = Date.now() - startTime;

    // Publication événement succès au DomainEventBus
    DomainEventBus.getInstance().publish({
      type: this.getEventFromWorkflowType(wf.type),
      emitterModule: 'AUDIT',
      tenantId: wf.tenantId,
      payload: { workflowId: wf.id, details: wf.title, data: wf.data }
    });

    this.notify();
  }

  /**
   * REPRISE ET RELANCE MANUELLE D'UN WORKFLOW ÉCHOUÉ
   */
  public async retryWorkflow(wfId: string): Promise<boolean> {
    const wf = this.workflows.get(wfId);
    if (!wf || wf.status !== 'FAILED') return false;

    wf.status = 'IN_PROGRESS';
    wf.errorReason = undefined;
    
    // Réinitialisation de l'étape échouée
    const failedStep = wf.steps.find(s => s.status === 'FAILED');
    if (failedStep) {
      failedStep.status = 'PENDING';
      failedStep.errorDetails = undefined;
    }

    this.notify();
    this.runStepsSequentially(wfId, Date.now());
    return true;
  }

  private getWorkflowTitle(type: WorkflowType): string {
    switch (type) {
      case 'WORKFLOW_1_TRANSPORT_BOOKING': return 'Workflow 1 : Réservation Billet Transport (12 étapes)';
      case 'WORKFLOW_2_HOTEL_BOOKING': return 'Workflow 2 : Réservation Hôtelière (10 étapes)';
      case 'WORKFLOW_3_CREATE_AGENCY': return 'Workflow 3 : Création d’Agence (Auto-Provisioning Atomique)';
      case 'WORKFLOW_4_CREATE_HOTEL': return 'Workflow 4 : Création d’Hôtel (Auto-Provisioning Atomique)';
      case 'WORKFLOW_5_PAYMENT_ENGINE': return 'Workflow 5 : Validation & Traitement de Paiement Unifié';
      case 'WORKFLOW_6_VISION_AI_ALERT': return 'Workflow 6 : Vidéosurveillance & Alerte IA Sécurité';
      case 'WORKFLOW_7_IPTV_ACTIVATION': return 'Workflow 7 : Activation IPTV & Bouquet TV Room';
      case 'WORKFLOW_8_NOTIFICATION_ROUTING': return 'Workflow 8 : Routage Centralisé des Notifications';
      case 'WORKFLOW_9_AICORE_ANALYSIS': return 'Workflow 9 : Analyse & Prédiction IA Métier';
      case 'WORKFLOW_10_SUPERVISION_RECOVERY': return 'Workflow 10 : Auto-Correction & Reprise Incident';
    }
  }

  private getEventFromWorkflowType(type: WorkflowType): any {
    switch (type) {
      case 'WORKFLOW_1_TRANSPORT_BOOKING': return 'ReservationConfirmed';
      case 'WORKFLOW_2_HOTEL_BOOKING': return 'ReservationConfirmed';
      case 'WORKFLOW_3_CREATE_AGENCY': return 'AgenceCreated';
      case 'WORKFLOW_4_CREATE_HOTEL': return 'HotelCreated';
      case 'WORKFLOW_5_PAYMENT_ENGINE': return 'PaymentCompleted';
      case 'WORKFLOW_6_VISION_AI_ALERT': return 'CameraAlertDetected';
      case 'WORKFLOW_7_IPTV_ACTIVATION': return 'IPTVSubscriptionActivated';
      default: return 'UserCreated';
    }
  }

  private getWorkflowStepsTemplate(type: WorkflowType): IWorkflowStep[] {
    switch (type) {
      case 'WORKFLOW_1_TRANSPORT_BOOKING':
        return [
          { id: 's1', stepNumber: 1, title: 'Vérification Identité & Droits Utilisateur', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Vérification Places Disponibles Autocar', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Verrouillage Temporaire du Siège (ACID)', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Calcul Tarifaire Dynamique (Promos & Commissions)', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Création Réservation Provisoire', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Déclenchement Transaction Paiement (Wave/Mobile)', status: 'PENDING' },
          { id: 's7', stepNumber: 7, title: 'Confirmation / Validation Financière', status: 'PENDING' },
          { id: 's8', stepNumber: 8, title: 'Génération Billet QR Sécurisé ED25519', status: 'PENDING' },
          { id: 's9', stepNumber: 9, title: 'Envoi Notification Push & SMS Voyageur', status: 'PENDING' },
          { id: 's10', stepNumber: 10, title: 'Mise à jour Dashboard Admin Agence', status: 'PENDING' },
          { id: 's11', stepNumber: 11, title: 'Mise à jour Statistiques Super Admin', status: 'PENDING' },
          { id: 's12', stepNumber: 12, title: 'Enregistrement Journal d’Audit Immuable', status: 'PENDING' }
        ];

      case 'WORKFLOW_2_HOTEL_BOOKING':
        return [
          { id: 's1', stepNumber: 1, title: 'Vérification Disponibilités Chambres', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Verrouillage de la Chambre Sélectionnée', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Calcul du Prix Total du Séjour FCFA', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Création Fiche Réservation Hôtelière', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Déclenchement Paiement Unifié', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Confirmation Définitive du Séjour', status: 'PENDING' },
          { id: 's7', stepNumber: 7, title: 'Génération Confirmation avec Pass QR', status: 'PENDING' },
          { id: 's8', stepNumber: 8, title: 'Alerte Notification Admin Hôtel', status: 'PENDING' },
          { id: 's9', stepNumber: 9, title: 'Mise à jour Calendrier d’Occupation', status: 'PENDING' },
          { id: 's10', stepNumber: 10, title: 'Journalisation Opérationnelle Audit', status: 'PENDING' }
        ];

      case 'WORKFLOW_3_CREATE_AGENCY':
        return [
          { id: 's1', stepNumber: 1, title: 'Insertion Fiche Agence en Base', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Génération Compte Admin Agence Automatique', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Attribution Rôle RBAC ADMIN_AGENCY', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Rattachement Strict au Tenant (agencyId)', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Initialisation Paramètres Flotte & Gares', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Préparation Dashboards & Stats Agence', status: 'PENDING' },
          { id: 's7', stepNumber: 7, title: 'Émission Événement AgenceCreated & Audit Log', status: 'PENDING' }
        ];

      case 'WORKFLOW_4_CREATE_HOTEL':
        return [
          { id: 's1', stepNumber: 1, title: 'Création Fiche Établissement Hôtelier', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Génération Compte Admin Hôtel Automatique', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Attribution Rôle RBAC ADMIN_HOTEL', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Rattachement Strict au Tenant (hotelId)', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Initialisation Chambres, Tarifs & IPTV', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Espaces de Gestion & Dashboards Hôtel', status: 'PENDING' },
          { id: 's7', stepNumber: 7, title: 'Émission Événement HotelCreated & Audit Log', status: 'PENDING' }
        ];

      case 'WORKFLOW_5_PAYMENT_ENGINE':
        return [
          { id: 's1', stepNumber: 1, title: 'Contrôle Antifraude & Montant FCFA', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Appel Gateway Mobile Money / Wave / CB', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Validation ou Traitement Refus', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Émission Reçu Financier PDF Certifié', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Calcul Commission Plateforme National', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Mise à jour Écritures Comptables & Audit', status: 'PENDING' }
        ];

      case 'WORKFLOW_6_VISION_AI_ALERT':
        return [
          { id: 's1', stepNumber: 1, title: 'Capture Événement Caméra RTSP Embarquée', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Analyse IA Vision (Somnolence / Fatigue / Collision)', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Classification Gravité Alerte (CRITICAL / INFO)', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Notification Urgence Push aux Opérateurs', status: 'PENDING' },
          { id: 's5', stepNumber: 5, title: 'Sauvegarde Séquence Vidéo sur Storage Securisé', status: 'PENDING' },
          { id: 's6', stepNumber: 6, title: 'Archivage Horodaté & Inscription Audit Log', status: 'PENDING' }
        ];

      default:
        return [
          { id: 's1', stepNumber: 1, title: 'Initialisation du Processus Métier', status: 'PENDING' },
          { id: 's2', stepNumber: 2, title: 'Vérification des Habilitations', status: 'PENDING' },
          { id: 's3', stepNumber: 3, title: 'Traitement Atomique', status: 'PENDING' },
          { id: 's4', stepNumber: 4, title: 'Notification & Audit Final', status: 'PENDING' }
        ];
    }
  }

  private seedInitialWorkflows(): void {
    const seeded: IWorkflowInstance[] = [
      {
        id: 'wf-res-001',
        title: 'Workflow 1 : Réservation Billet Transport (12 étapes)',
        type: 'WORKFLOW_1_TRANSPORT_BOOKING',
        status: 'COMPLETED',
        tenantId: 'agency-utb',
        tenantType: 'AGENCY',
        initiatedBy: 'Kouassi Marc (Voyageur)',
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3598000).toISOString(),
        executionTimeMs: 2000,
        currentStepIndex: 11,
        steps: this.getWorkflowStepsTemplate('WORKFLOW_1_TRANSPORT_BOOKING').map(s => ({
          ...s, status: 'COMPLETED', completedAt: new Date().toISOString()
        })),
        data: { passengerName: 'Kouassi Marc', ticketPrice: 7500, seat: 14 }
      },
      {
        id: 'wf-ag-002',
        title: 'Workflow 3 : Création d’Agence (Auto-Provisioning Atomique)',
        type: 'WORKFLOW_3_CREATE_AGENCY',
        status: 'COMPLETED',
        tenantId: 'agency-utb',
        tenantType: 'AGENCY',
        initiatedBy: 'Super Admin National',
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        completedAt: new Date(Date.now() - 7198500).toISOString(),
        executionTimeMs: 1500,
        currentStepIndex: 6,
        steps: this.getWorkflowStepsTemplate('WORKFLOW_3_CREATE_AGENCY').map(s => ({
          ...s, status: 'COMPLETED', completedAt: new Date().toISOString()
        })),
        data: { agencyName: 'UTB Express', adminCreated: 'admin.utb@express.ci' }
      }
    ];

    seeded.forEach(w => this.workflows.set(w.id, w));
  }
}
