import React, { useState } from 'react';
import { Camera, ShieldCheck, Video, Lock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface CameraPermissionModalProps {
  isOpen: boolean;
  purposeTitle: string;
  purposeDescription: string;
  onGranted: (stream?: MediaStream) => void;
  onCancel: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  purposeTitle,
  purposeDescription,
  onGranted,
  onCancel,
}) => {
  const [step, setStep] = useState<'EXPLANATION' | 'REQUESTING' | 'DENIED'>('EXPLANATION');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleRequestNativePermission = async () => {
    setStep('REQUESTING');
    setErrorMessage('');

    try {
      // Access central browser navigator.mediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'API vidéo n'est pas supportée par ce navigateur ou dans cet iFrame.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      // Permission granted! Pass stream to caller
      onGranted(stream);
    } catch (err: any) {
      console.warn("Camera permission request result:", err);
      setStep('DENIED');
      setErrorMessage(
        err?.message || "L'accès à la caméra a été refusé par l'utilisateur ou la politique de sécurité de l'appareil."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 mx-auto">
          <Camera className="w-7 h-7" />
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" />
            <span>Gestionnaire Centralisé des Autorisations IVOIReXpress</span>
          </div>

          <h3 className="text-xl font-extrabold text-white">{purposeTitle}</h3>
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            {purposeDescription}
          </p>
        </div>

        {/* Educational Checklist before OS prompt */}
        {step === 'EXPLANATION' && (
          <div className="mt-5 space-y-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-start space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Sécurité & Confidentialité :</strong> Votre caméra ne sera activée que pendant cette opération précise.</span>
              </div>
              <div className="flex items-start space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Contrôle utilisateur :</strong> Aucune vidéo ou image n'est enregistrée sur votre téléphone à votre insu.</span>
              </div>
              <div className="flex items-start space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong>Support multi-usage :</strong> Valable pour le scan QR Code de billet et la détection de caméra IP.</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleRequestNativePermission}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/30"
              >
                <Video className="w-4 h-4" />
                <span>Autoriser l'accès Caméra</span>
              </button>
            </div>
          </div>
        )}

        {/* Requesting Loader */}
        {step === 'REQUESTING' && (
          <div className="mt-6 text-center space-y-3 py-4">
            <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">
              Demande d'autorisation du système d'exploitation en cours...
            </p>
            <p className="text-[11px] text-slate-500">
              Veuillez cliquer sur "Autoriser" dans la fenêtre pop-up de votre navigateur.
            </p>
          </div>
        )}

        {/* Denied state with troubleshooting guidance */}
        {step === 'DENIED' && (
          <div className="mt-5 space-y-4">
            <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="flex items-center space-x-2 text-rose-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Accès Caméra Non Disponible</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Pour réactiver la caméra, vérifiez les paramètres de confidentialité de votre navigateur ou utilisez le mode simulation automatique d'IVOIReXpress.
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setStep('EXPLANATION');
                  // Trigger fallback grant for testing in sandboxed environments
                  onGranted();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs"
              >
                Continuer en Mode Simulation Sécurisée
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
