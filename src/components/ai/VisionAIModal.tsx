import React, { useState } from 'react';
import { Camera } from '../../types';
import { Sparkles, ShieldAlert, CheckCircle2, X, Eye, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../../lib/api';

interface VisionAIModalProps {
  camera: Camera | null;
  onClose: () => void;
}

export const VisionAIModal: React.FC<VisionAIModalProps> = ({ camera, onClose }) => {
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!camera) return null;

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/ai/vision-analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraName: camera.name,
          locationName: camera.locationName,
          eventType: camera.motionDetected ? 'Mouvement Anormal' : 'Surveillance Continue Standard',
          description: `Flux HD direct provenance ${camera.locationName}. Détection automatique de présence et balayage de zone.`
        })
      });

      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Analyse Vision par Gemini AI Core</span>
        </div>

        <h2 className="text-xl font-extrabold text-white mb-1">{camera.name}</h2>
        <p className="text-xs text-slate-400 mb-4">{camera.locationName} ({camera.city})</p>

        {/* Camera Image Frame */}
        <div className="rounded-xl overflow-hidden aspect-video bg-black border border-slate-800 mb-4 relative">
          <img src={camera.streamUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'} alt={camera.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-950/80 text-[10px] text-emerald-400 font-mono rounded">
            {camera.resolution} • {camera.fps} FPS
          </div>
        </div>

        {!analysisResult ? (
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyse du flux par Gemini en cours...</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>Lancer l'Analyse IA Sécurité</span>
              </>
            )}
          </button>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Niveau de Menace Évalué :</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                analysisResult.threatLevel === 'Critique'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : analysisResult.threatLevel === 'Moyenne'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {analysisResult.threatLevel}
              </span>
            </div>

            <p className="text-slate-300 leading-relaxed">{analysisResult.summary}</p>

            {analysisResult.recommendedActions && (
              <div>
                <h4 className="font-bold text-slate-400 text-[10px] uppercase mb-1">Actions Recommandées :</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {analysisResult.recommendedActions.map((action: string, idx: number) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
