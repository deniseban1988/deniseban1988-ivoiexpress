import { IVisionUseCase, IVisionRepository } from '../../ports/vision.ports';
import { IAuditLoggerPort } from '../../ports/transversal.ports';
import { VisionDomain } from '../../domain/vision/VisionDomain';
import { TransversalDomain } from '../../domain/transversal/TransversalDomain';
import { Camera, VisionAlert, UserRole } from '../../../types';

export class VisionUseCases implements IVisionUseCase {
  constructor(
    private repository: IVisionRepository,
    private auditLogger: IAuditLoggerPort
  ) {}

  async getLiveStreams(userRole: UserRole, agencyOrHotelId?: string): Promise<Camera[]> {
    if (!TransversalDomain.hasPermission(userRole, 'Vision', 'READ')) {
      throw new Error("Accès refusé. Droits de vidéosurveillance insuffisants.");
    }
    return this.repository.getCameras(agencyOrHotelId);
  }

  async getSecurityAlerts(userRole: UserRole, agencyOrHotelId?: string): Promise<VisionAlert[]> {
    if (!TransversalDomain.hasPermission(userRole, 'Vision', 'READ')) {
      throw new Error("Accès refusé au registre d'alertes Vision IA.");
    }
    return this.repository.getAlerts(agencyOrHotelId);
  }

  async addNewCamera(cameraData: Partial<Camera>, userRole: UserRole): Promise<Camera> {
    if (!TransversalDomain.hasPermission(userRole, 'Vision', 'WRITE')) {
      throw new Error("Seuls les administrateurs peuvent configurer de nouvelles caméras.");
    }

    const val = VisionDomain.validateCameraConfiguration(cameraData);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const camera = await this.repository.addCamera(cameraData);

    await this.auditLogger.logAction(
      `User-${userRole}`,
      userRole,
      'AJOUT_CAMÉRA_VISION_IA',
      'Vision',
      `Caméra "${camera.name}" (${camera.technology}, ${camera.protocol}) ajoutée à ${camera.locationName}.`,
      'Succès'
    );

    return camera;
  }

  async dismissSecurityAlert(alertId: string, userRole: UserRole): Promise<boolean> {
    if (!TransversalDomain.hasPermission(userRole, 'Vision', 'WRITE')) {
      throw new Error("Permissions insuffisantes pour acquitter les alertes.");
    }

    const success = await this.repository.resolveAlert(alertId);

    if (success) {
      await this.auditLogger.logAction(
        `User-${userRole}`,
        userRole,
        'ACQUITTEMENT_ALERTE_VISION',
        'Vision',
        `Alerte #${alertId} marquée comme résolue par l'opérateur.`,
        'Succès'
      );
    }

    return success;
  }
}
