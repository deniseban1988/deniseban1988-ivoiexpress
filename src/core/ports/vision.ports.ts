import { Camera, VisionAlert, CameraRecording, UserRole } from '../../types';

export interface IVisionRepository {
  getCameras(ownerId?: string, ownerType?: string): Promise<Camera[]>;
  getAlerts(agencyId?: string): Promise<VisionAlert[]>;
  getRecordings(cameraId?: string): Promise<CameraRecording[]>;
  addCamera(camera: Partial<Camera>): Promise<Camera>;
  resolveAlert(alertId: string): Promise<boolean>;
}

export interface IVisionUseCase {
  getLiveStreams(userRole: UserRole, agencyOrHotelId?: string): Promise<Camera[]>;
  getSecurityAlerts(userRole: UserRole, agencyOrHotelId?: string): Promise<VisionAlert[]>;
  addNewCamera(cameraData: Partial<Camera>, userRole: UserRole): Promise<Camera>;
  dismissSecurityAlert(alertId: string, userRole: UserRole): Promise<boolean>;
}
