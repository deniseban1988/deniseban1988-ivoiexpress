import { Camera, VisionAlert, AIModelDetection } from '../../../types';

export class VisionDomain {
  /**
   * Assess alert threat level based on AI detection type
   */
  static evaluateThreatSeverity(alertType: AIModelDetection): 'Critique' | 'Moyenne' | 'Faible' {
    switch (alertType) {
      case 'Intrusion Zone Sécurisée':
      case 'Anomalie Visuelle / Incendie':
      case 'Attroupement Suspect':
        return 'Critique';
      case 'Objet Abandonné / Bagage':
      case 'Chute de Personne':
      case 'Véhicule Suspect':
        return 'Moyenne';
      default:
        return 'Faible';
    }
  }

  /**
   * Validate camera stream protocol & parameters
   */
  static validateCameraConfiguration(camera: Partial<Camera>): { valid: boolean; error?: string } {
    if (!camera.name || !camera.streamUrl) {
      return { valid: false, error: "Le nom de la caméra et l'URL du flux sont obligatoires." };
    }
    if (!camera.streamUrl.startsWith('rtsp://') && !camera.streamUrl.startsWith('http://') && !camera.streamUrl.startsWith('https://')) {
      return { valid: false, error: "L'URL du flux doit respecter les protocoles sécurisés RTSP, HTTP ou HTTPS." };
    }
    return { valid: true };
  }
}
