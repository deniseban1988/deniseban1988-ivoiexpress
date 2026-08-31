import React, { useState } from 'react';
import { UserRole } from '../../types';
import { getApiUrl } from '../../lib/api';
import {
  AIAssistantType,
  AISmartAction,
  AIMemoryEntry
} from '../../types/aicore';
import { INITIAL_ASSISTANTS_CONFIG, INITIAL_AI_MEMORIES } from '../../data/aiCoreMockData';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RefreshCw,
  Shield,
  Bus,
  Hotel,
  Eye,
  Tv,
  Crown,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Check,
  Brain,
  Sliders,
  ShieldCheck,
  Trash2,
  Plus
} from 'lucide-react';

interface AICoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  assistantType: AIAssistantType;
  assistantName: string;
  text: string;
  timestamp: string;
  smartAction?: AISmartAction;
}

export const AICoreDrawer: React.FC<AICoreDrawerProps> = ({ isOpen, onClose, userRole }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'memory'>('chat');
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistantType>('VOYAGEUR');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      assistantType: 'VOYAGEUR',
      assistantName: userRole === 'VOYAGEUR' ? 'Aya • Assistant Voyageur' : 'AI Core Orchestrator',
      text: userRole === 'VOYAGEUR'
        ? "Bonjour ! Je suis Aya, votre assistante voyage IVOIReXpress. Je suis là pour vous aider à réserver vos billets de car VIP, vos séjours à l'hôtel, et profiter de vos services en toute sérénité. Comment puis-je vous aider ?"
        : "Bonjour ! Je suis l'AI Core d'IVOIReXpress. Sélectionnez un assistant spécialisé selon votre besoin (Transport, Hôtellerie, Vision IA, IPTV, Administration). Comment puis-je vous assister ?",
      timestamp: new Date().toLocaleTimeString().substring(0, 5)
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // AI Memory State
  const [memories, setMemories] = useState<AIMemoryEntry[]>(INITIAL_AI_MEMORIES);
  const [newMemKey, setNewMemKey] = useState('');
  const [newMemVal, setNewMemVal] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentConfig = INITIAL_ASSISTANTS_CONFIG.find(a => a.type === selectedAssistant) || INITIAL_ASSISTANTS_CONFIG[0];

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputText;
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      assistantType: selectedAssistant,
      assistantName: 'Moi',
      text: prompt,
      timestamp: new Date().toLocaleTimeString().substring(0, 5)
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/ai/assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantType: selectedAssistant,
          prompt,
          userRole,
          memories
        })
      });

      const data = await response.json();

      // Check if prompt suggests an interactive smart action proposal
      let smartAction: AISmartAction | undefined = undefined;
      const lower = prompt.toLowerCase();
      if (lower.includes('réserv') || lower.includes('billet') || lower.includes('car')) {
        smartAction = {
          id: `act-${Date.now()}`,
          title: "Proposer réservation de voyage Abidjan -> Yamoussoukro",
          description: "Réservation autocar VIP Climatisé UTB Express pour 14h30 (5 000 FCFA).",
          targetModule: "Transport",
          actionType: "RESERVATION_PROPOSAL",
          payload: { departureCity: "Abidjan", arrivalCity: "Yamoussoukro", agency: "UTB Express", price: 5000 },
          requiresValidation: true,
          status: "PROPOSED",
          createdAt: new Date().toLocaleTimeString().substring(0, 5)
        };
      } else if (lower.includes('caméra') || lower.includes('vision') || lower.includes('alerte')) {
        smartAction = {
          id: `act-${Date.now()}`,
          title: "Suggérer vérification caméra Cam#02 Gare Adjamé VIP",
          description: "Inspecter la zone de détection visuelle et réajuster la sensibilité nocturne.",
          targetModule: "Vision",
          actionType: "CAMERA_CHECK_SUGGESTION",
          payload: { cameraName: "Cam#02 Quai 1", location: "Gare Adjamé VIP" },
          requiresValidation: true,
          status: "PROPOSED",
          createdAt: new Date().toLocaleTimeString().substring(0, 5)
        };
      } else if (lower.includes('hôtel') || lower.includes('chambre')) {
        smartAction = {
          id: `act-${Date.now()}`,
          title: "Suggérer réservation Hôtel Résidence les Lagunes",
          description: "Nuitée avec petit-déjeuner inclus à San-Pédro (35 000 FCFA / nuit).",
          targetModule: "Hôtellerie",
          actionType: "HOTEL_RECOMMENDATION",
          payload: { hotelName: "Hôtel Résidence les Lagunes", price: 35000 },
          requiresValidation: true,
          status: "PROPOSED",
          createdAt: new Date().toLocaleTimeString().substring(0, 5)
        };
      }

      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        assistantType: selectedAssistant,
        assistantName: data.assistantName || currentConfig.name,
        text: data.reply || "Traitement effectué avec succès.",
        timestamp: new Date().toLocaleTimeString().substring(0, 5),
        smartAction: data.proposedAction || smartAction
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          assistantType: selectedAssistant,
          assistantName: currentConfig.name,
          text: `[Offline Mode ${currentConfig.name}] Je réponds à votre demande "${prompt}". Nos services de transport, hôtellerie, IPTV et vidéosurveillance sont disponibles.`,
          timestamp: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAction = (action: AISmartAction) => {
    setActionSuccessToast(`Action "${action.title}" validée et exécutée par le module métier ${action.targetModule} !`);
    setTimeout(() => setActionSuccessToast(null), 4000);

    setMessages(prev =>
      prev.map(m => {
        if (m.smartAction && m.smartAction.id === action.id) {
          return {
            ...m,
            smartAction: { ...m.smartAction, status: 'EXECUTED' }
          };
        }
        return m;
      })
    );
  };

  const handleRejectAction = (action: AISmartAction) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.smartAction && m.smartAction.id === action.id) {
          return {
            ...m,
            smartAction: { ...m.smartAction, status: 'REJECTED' }
          };
        }
        return m;
      })
    );
  };

  const handleAddMemory = () => {
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    const entry: AIMemoryEntry = {
      id: `mem-${Date.now()}`,
      key: newMemKey,
      value: newMemVal,
      category: 'PREFERENCE',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isConfidential: false
    };
    setMemories(prev => [entry, ...prev]);
    setNewMemKey('');
    setNewMemVal('');
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const getAssistantIcon = (type: AIAssistantType) => {
    switch (type) {
      case 'VOYAGEUR': return <Sparkles className="w-4 h-4 text-orange-400" />;
      case 'TRANSPORT': return <Bus className="w-4 h-4 text-emerald-400" />;
      case 'HOTEL': return <Hotel className="w-4 h-4 text-blue-400" />;
      case 'VISION': return <Eye className="w-4 h-4 text-purple-400" />;
      case 'IPTV': return <Tv className="w-4 h-4 text-amber-400" />;
      case 'SUPER_ADMIN': return <Crown className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
      
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <span>{userRole === 'VOYAGEUR' ? 'Aya • Assistant Virtuel' : 'AI Core Orchestrator'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                {userRole === 'VOYAGEUR' ? 'En ligne' : 'v6.0 Active'}
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">
              {userRole === 'VOYAGEUR' ? 'Assistance aux voyages & services IVOIReXpress' : 'Services Transversaux & Multi-Assistants'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab(activeTab === 'chat' ? 'memory' : 'chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'memory'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Mémoire IA</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Action Success Toast */}
      {actionSuccessToast && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Tab 1: Multi-Assistant Chat */}
      {activeTab === 'chat' && (
        <>
          {/* Assistant Selector Bar */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Sélecteur d'Assistant Spécialisé :</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {INITIAL_ASSISTANTS_CONFIG
                .filter(ast => userRole !== 'VOYAGEUR' || ['VOYAGEUR', 'TRANSPORT', 'HOTEL', 'IPTV'].includes(ast.type))
                .map(ast => {
                const isSelected = selectedAssistant === ast.type;
                return (
                  <button
                    key={ast.type}
                    onClick={() => setSelectedAssistant(ast.type)}
                    className={`p-2 rounded-xl text-left flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {getAssistantIcon(ast.type)}
                    <span className="text-[9px] font-bold mt-1 text-center truncate w-full">{ast.avatarLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Assistant Banner */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2">
                {getAssistantIcon(currentConfig.type)}
                <div>
                  <span className="font-extrabold text-white">{currentConfig.name}</span>
                  <span className="text-[10px] text-slate-400 block">{currentConfig.description}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[9px] font-mono shrink-0">
                {currentConfig.targetRole}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
                    {getAssistantIcon(msg.assistantType)}
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-orange-500 text-white font-medium rounded-tr-none shadow-md shadow-orange-500/10'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="text-[10px] font-extrabold text-orange-400 mb-1 flex items-center justify-between">
                        <span>{msg.assistantName}</span>
                        <span className="text-slate-500 font-mono text-[9px]">{msg.timestamp}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.sender === 'user' && (
                      <span className="text-[9px] text-orange-200/80 block mt-1 text-right font-mono">{msg.timestamp}</span>
                    )}
                  </div>

                  {/* Interactive Smart Action Card */}
                  {msg.smartAction && (
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-orange-500/30 text-xs text-slate-300 space-y-2 shadow-xl">
                      <div className="flex items-center justify-between text-orange-400 font-bold text-[11px]">
                        <span className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Action Recommandée par L'AI Core</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 text-[9px]">
                          {msg.smartAction.targetModule}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-white">{msg.smartAction.title}</h4>
                        <p className="text-[11px] text-slate-400">{msg.smartAction.description}</p>
                      </div>

                      {msg.smartAction.status === 'PROPOSED' ? (
                        <div className="pt-1 flex items-center space-x-2">
                          <button
                            onClick={() => handleValidateAction(msg.smartAction!)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[11px] flex items-center justify-center space-x-1 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider & Exécuter</span>
                          </button>
                          <button
                            onClick={() => handleRejectAction(msg.smartAction!)}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[11px] transition-all"
                          >
                            Refuser
                          </button>
                        </div>
                      ) : msg.smartAction.status === 'EXECUTED' ? (
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Action validée et exécutée par le module {msg.smartAction.targetModule}</span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                          Action déclinée par l'utilisateur.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-orange-400 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 w-fit">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{currentConfig.name} analyse les données...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800">
            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Suggestions {currentConfig.name} :</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {currentConfig.samplePrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium whitespace-nowrap border border-slate-700 transition-all shrink-0"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={`Interroger ${currentConfig.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-all shadow-md shadow-orange-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Tab 2: AI Memory & Context */}
      {activeTab === 'memory' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-extrabold text-xs">
              <Brain className="w-4 h-4" />
              <span>Système de Mémoire IA Persistante</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              L'AI Core conserve le contexte des conversations pour vous offrir une expérience fluide sans jamais outrepasser la confidentialité de vos données.
            </p>
          </div>

          {/* Add New Memory Rule */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ajouter une Préférence en Mémoire</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Ex: Ville de départ par défaut"
                value={newMemKey}
                onChange={(e) => setNewMemKey(e.target.value)}
                className="bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
              />
              <input
                type="text"
                placeholder="Ex: Abidjan Adjamé VIP"
                value={newMemVal}
                onChange={(e) => setNewMemVal(e.target.value)}
                className="bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
              />
            </div>
            <button
              onClick={handleAddMemory}
              disabled={!newMemKey || !newMemVal}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enregistrer la Préférence</span>
            </button>
          </div>

          {/* Memory List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mémoires Retenues :</h3>
            {memories.map(mem => (
              <div key={mem.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span>{mem.key}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-purple-300">
                      {mem.category}
                    </span>
                  </div>
                  <div className="text-slate-300 mt-0.5">{mem.value}</div>
                  <div className="text-[9px] text-slate-500 mt-1">Mis à jour le {mem.updatedAt}</div>
                </div>

                <button
                  onClick={() => handleDeleteMemory(mem.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Security Guardrails Info */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Garanties de Sécurité & Non-Substitution</span>
            </div>
            <p>
              L'AI Core n'accède pas directement aux bases de données, ne peut pas contourner les rôles RBAC, et demande toujours votre confirmation explicite pour chaque action sensible.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
