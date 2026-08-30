import React from 'react';
import { Camera, VisionAlert } from '../../types';
import { VisionDashboard } from '../vision/VisionDashboard';

interface PersonalVisionProps {
  cameras: Camera[];
  alerts: VisionAlert[];
  onAddCamera: (camera: Camera) => void;
  onUpdateCamera?: (camera: Camera) => void;
  onDeleteCamera?: (cameraId: string) => void;
  onResolveAlert?: (alertId: string, status: 'Résolu' | 'Faux Positif') => void;
  onAnalyzeCameraWithAI: (camera: Camera) => void;
}

export const PersonalVision: React.FC<PersonalVisionProps> = ({
  cameras,
  alerts,
  onAddCamera,
  onUpdateCamera = () => {},
  onDeleteCamera = () => {},
  onResolveAlert = () => {},
  onAnalyzeCameraWithAI
}) => {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <VisionDashboard
        userRole="VOYAGEUR"
        cameras={cameras}
        alerts={alerts}
        onAddCamera={onAddCamera}
        onUpdateCamera={onUpdateCamera}
        onDeleteCamera={onDeleteCamera}
        onResolveAlert={onResolveAlert}
      />
    </div>
  );
};
