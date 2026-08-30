import React, { useState } from 'react';
import { CameraRecording, AIModelDetection } from '../../types';
import { 
  X, Play, Download, Calendar, HardDrive, Film, Sparkles, Filter, Clock, Search, ShieldAlert, CheckCircle2 
} from 'lucide-react';

interface RecordingsArchiveModalProps {
  recordings: CameraRecording[];
  onClose: () => void;
}

export const RecordingsArchiveModal: React.FC<RecordingsArchiveModalProps> = ({
  recordings,
  onClose
}) => {
  const [selectedRecording, setSelectedRecording] = useState<CameraRecording | null>(recordings[0] || null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const filteredRecordings = recordings.filter(rec => {
    const matchesSearch = rec.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rec.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'ALL') return matchesSearch;
    if (filterType === 'AI') return matchesSearch && rec.recordType === 'Événement IA';
    if (filterType === 'MANUAL') return matchesSearch && rec.recordType === 'Manuel';
    return matchesSearch;
  });

  const handleDownloadClip = (rec: CameraRecording) => {
    alert(`Téléchargement de la séquence "${rec.cameraName}" (${rec.duration} - ${rec.fileSizeMb} MB) démarré au format MP4 sécurisé.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Film className="w-4 h-4" />
            <span>Centre d'Archivage & Enregistrements Vidéo</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Séquences Vidéo & Événements Horodatés</h2>
        </div>

        {/* Main Content split into Player & Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden flex-1">
          
          {/* Left Column: Player & Active Recording Detail (7 cols) */}
          <div className="md:col-span-7 space-y-4 flex flex-col">
            {selectedRecording ? (
              <div className="space-y-3">
                
                {/* Video Player Box */}
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video shadow-lg group">
                  <img
                    src={selectedRecording.thumbnailUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                    alt={selectedRecording.cameraName}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition transform hover:scale-110 shadow-xl"
                    >
                      <Play className="w-7 h-7 fill-slate-950 ml-1" />
                    </button>
                  </div>

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur rounded-xl text-[10px] text-amber-400 font-bold border border-slate-800">
                    {selectedRecording.recordType} • {selectedRecording.duration}
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadClip(selectedRecording)}
                    className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition"
                    title="Télécharger la séquence"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {/* Details Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm">{selectedRecording.cameraName}</h3>
                    <span className="text-slate-400 font-mono text-[11px]">{selectedRecording.startTime}</span>
                  </div>

                  <p className="text-slate-400">{selectedRecording.locationName}</p>

                  {selectedRecording.aiSummary && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-200 text-[11px] space-y-1">
                      <div className="font-bold flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Résumé IA Gemini Vision :</span>
                      </div>
                      <p>{selectedRecording.aiSummary}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                    <span className="flex items-center space-x-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      <span>Taille : {selectedRecording.fileSizeMb} MB</span>
                    </span>
                    <button
                      onClick={() => handleDownloadClip(selectedRecording)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger Extrait MP4</span>
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Sélectionnez une séquence pour visualiser l'enregistrement.
              </div>
            )}
          </div>

          {/* Right Column: Search & List (5 cols) */}
          <div className="md:col-span-5 space-y-3 flex flex-col h-full overflow-hidden">
            
            {/* Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher par caméra ou lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex space-x-1 text-[10px]">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`flex-1 py-1 rounded-lg border font-bold ${
                    filterType === 'ALL' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterType('AI')}
                  className={`flex-1 py-1 rounded-lg border font-bold ${
                    filterType === 'AI' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Événements IA
                </button>
                <button
                  onClick={() => setFilterType('MANUAL')}
                  className={`flex-1 py-1 rounded-lg border font-bold ${
                    filterType === 'MANUAL' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Manuels
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {filteredRecordings.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecording(rec)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center space-x-3 ${
                    selectedRecording?.id === rec.id
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 relative">
                    <img src={rec.thumbnailUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'} alt={rec.cameraName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <h4 className="font-bold text-white truncate">{rec.cameraName}</h4>
                    <span className="text-[10px] text-slate-400 block">{rec.startTime}</span>
                    <span className="text-[9px] font-bold text-amber-400">{rec.duration} • {rec.recordType}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
