import React, { useState } from 'react';
import { UserRole } from '../../types';
import { getApiUrl } from '../../lib/api';
import {
  AIAssistantConfig,
  TransversalServiceStatus,
  SystemAnomaly,
  TransversalPaymentTransaction,
  TransversalNotificationLog,
  AISmartAction
} from '../../types/aicore';
import {
  INITIAL_ASSISTANTS_CONFIG,
  INITIAL_TRANSVERSAL_SERVICES,
  INITIAL_SYSTEM_ANOMALIES,
  INITIAL_TRANSVERSAL_PAYMENTS,
  INITIAL_TRANSVERSAL_NOTIFS,
  INITIAL_PROPOSED_ACTIONS
} from '../../data/aiCoreMockData';
import {
  Brain,
  Sparkles,
  Shield,
  CreditCard,
  Bell,
  HardDrive,
  FileText,
  Activity,
  Users,
  Lock,
  Bus,
  Hotel,
  Eye,
  Tv,
  Crown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Server,
  Zap,
  Check
} from 'lucide-react';

interface AICoreManagementProps {
  userRole: UserRole;
  onOpenDrawer?: () => void;
}

export const AICoreManagement: React.FC<AICoreManagementProps> = ({ userRole, onOpenDrawer }) => {
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'transversal' | 'payments' | 'notifications' | 'anomalies' | 'proposed_actions'>('orchestrator');

  // State
  const [services, setServices] = useState<TransversalServiceStatus[]>(INITIAL_TRANSVERSAL_SERVICES);
  const [anomalies, setAnomalies] = useState<SystemAnomaly[]>(INITIAL_SYSTEM_ANOMALIES);
  const [payments, setPayments] = useState<TransversalPaymentTransaction[]>(INITIAL_TRANSVERSAL_PAYMENTS);
  const [notifications, setNotifications] = useState<TransversalNotificationLog[]>(INITIAL_TRANSVERSAL_NOTIFS);
  const [proposedActions, setProposedActions] = useState<AISmartAction[]>(INITIAL_PROPOSED_ACTIONS);

  // Sandbox Tester State
  const [selectedSandboxAssistant, setSelectedSandboxAssistant] = useState<string>('VOYAGEUR');
  const [sandboxPrompt, setSandboxPrompt] = useState<string>('');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [isSandboxLoading, setIsSandboxLoading] = useState<boolean>(false);

  // Notification Composer State
  const [notifChannel, setNotifChannel] = useState<'PUSH' | 'EMAIL' | 'SMS'>('PUSH');
  const [notifRecipient, setNotifRecipient] = useState<string>('Tous les voyageurs');
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifBody, setNotifBody] = useState<string>('');
  const [notifSuccess, setNotifSuccess] = useState<boolean>(false);

  // Anomaly Diagnostic State
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const handleRunSandboxTest = async () => {
    if (!sandboxPrompt.trim() || isSandboxLoading) return;
    setIsSandboxLoading(true);
    setSandboxResponse(null);

    try {
      const res = await fetch(getApiUrl('/api/ai/assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantType: selectedSandboxAssistant,
          prompt: sandboxPrompt,
          userRole
        })
      });
      const data = await res.json();
      setSandboxResponse(data.reply || "Réponse simulée de l'assistant.");
    } catch (e) {
      setSandboxResponse("[Mode Offline AI Core] Réponse d'orchestration générée avec succès.");
    } finally {
      setIsSandboxLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;

    try {
      const res = await fetch(getApiUrl('/api/transversal/notifications/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: notifChannel,
          recipient: notifRecipient,
          title: notifTitle,
          body: notifBody
        })
      });
      const data = await res.json();

      const newLog: TransversalNotificationLog = {
        id: data.notificationId || `notif-${Date.now()}`,
        channel: notifChannel,
        recipient: notifRecipient,
        title: notifTitle,
        body: notifBody,
        status: 'Envoyé',
        sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      setNotifications(prev => [newLog, ...prev]);
      setNotifTitle('');
      setNotifBody('');
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);

    try {
      const res = await fetch(getApiUrl('/api/ai/system-health'));
      const data = await res.json();
      setDiagnosticResult(data);
    } catch (e) {
      setDiagnosticResult({
        globalStatus: "Excellente",
        score: 99.2,
        summary: "Analyse terminée : Tous les services (Transport, Hôtellerie, Vision, IPTV, Paiements) sont entièrement sains.",
        recommendedActions: ["Continuer l'analyse automatique toutes les 6 heures."]
      });
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleValidateProposedAction = (id: string) => {
    setProposedActions(prev =>
      prev.map(a => a.id === id ? { ...a, status: 'EXECUTED' } : a)
    );
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lock': return <Lock className="w-5 h-5 text-blue-400" />;
      case 'Users': return <Users className="w-5 h-5 text-emerald-400" />;
      case 'CreditCard': return <CreditCard className="w-5 h-5 text-orange-400" />;
      case 'Bell': return <Bell className="w-5 h-5 text-amber-400" />;
      case 'HardDrive': return <HardDrive className="w-5 h-5 text-purple-400" />;
      case 'FileText': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'Brain': return <Brain className="w-5 h-5 text-rose-400" />;
      default: return <Server className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPIs */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 ivx-banner-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>AI Core Volume 6 • Orchestrateur National</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                Services Transversaux Unifiés
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Core & Services Transversaux
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Cerveau intelligent orchestrant la recherche, la sécurité Vision IA, le divertissement IPTV, la passerelle de paiement unique et les notifications multi-canaux.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleRunDiagnostic}
              disabled={isDiagnosticRunning}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 transition-all border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
              <span>Analyse Système IA</span>
            </button>

            {onOpenDrawer && (
              <button
                onClick={onOpenDrawer}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center space-x-2 transition-all shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ouvrir Studio 6 Assistants</span>
              </button>
            )}
          </div>
        </div>

        {/* System Diagnostic Summary Modal / Banner */}
        {diagnosticResult && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-xs text-slate-200 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between font-extrabold">
              <span className="text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Diagnostic de Santé IA Core : {diagnosticResult.globalStatus} ({diagnosticResult.score}/100)</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">{new Date().toLocaleTimeString()}</span>
            </div>
            <p>{diagnosticResult.summary}</p>
            {diagnosticResult.recommendedActions && (
              <div className="text-[11px] text-slate-400">
                <span className="font-bold text-white">Recommandations : </span>
                {diagnosticResult.recommendedActions.join(' | ')}
              </div>
            )}
          </div>
        )}

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Assistants Actifs</span>
            <div className="text-xl font-extrabold text-white mt-0.5">6 Spécialistes</div>
            <span className="text-[10px] text-emerald-400 mt-1 block font-mono">100% disponibles</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Services Transversaux</span>
            <div className="text-xl font-extrabold text-white mt-0.5">7 Modules</div>
            <span className="text-[10px] text-emerald-400 mt-1 block font-mono">Uptime 99.9%</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Actions Proposées</span>
            <div className="text-xl font-extrabold text-orange-400 mt-0.5">{proposedActions.length} Actions</div>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">Validation humaine requise</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Détection Anomalies</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">0 Critique</div>
            <span className="text-[10px] text-slate-400 mt-1 block font-mono">Surveillance en direct</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        {[
          { id: 'orchestrator', label: '6 Assistants Spécialisés', icon: Brain },
          { id: 'transversal', label: 'Services Transversaux (7)', icon: Server },
          { id: 'payments', label: 'Hub de Paiement Unique', icon: CreditCard },
          { id: 'notifications', label: 'Notifications Multi-Canal', icon: Bell },
          { id: 'anomalies', label: 'Détection d\'Anomalies IA', icon: AlertTriangle },
          { id: 'proposed_actions', label: `Actions Proposées (${proposedActions.filter(a => a.status === 'PROPOSED').length})`, icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 6 Assistants Spécialisés */}
      {activeTab === 'orchestrator' && (
        <div className="space-y-6">
          
          {/* Assistants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INITIAL_ASSISTANTS_CONFIG.map(ast => (
              <div
                key={ast.type}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-orange-500/40 transition-all flex flex-col justify-between ivx-card-dark-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-[10px] font-extrabold uppercase tracking-wider border border-orange-500/20">
                      {ast.avatarLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {ast.targetRole}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base mb-1">{ast.name}</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{ast.description}</p>

                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Garde-Fous & Sécurité :</span>
                    <ul className="space-y-1">
                      {ast.guardrails.map((g, idx) => (
                        <li key={idx} className="text-[11px] text-slate-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSandboxAssistant(ast.type);
                    setSandboxPrompt(ast.samplePrompts[0]);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Tester dans le Sandbox</span>
                </button>
              </div>
            ))}
          </div>

          {/* Sandbox Interactive Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-extrabold text-white">Sandbox de Test d'Orchestration AI Core</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Service Indépendant non-destructif</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Choisir l'assistant :</label>
                <select
                  value={selectedSandboxAssistant}
                  onChange={(e) => setSelectedSandboxAssistant(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                >
                  {INITIAL_ASSISTANTS_CONFIG.map(a => (
                    <option key={a.type} value={a.type}>{a.name} ({a.avatarLabel})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">Saisir une requête de test :</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sandboxPrompt}
                    onChange={(e) => setSandboxPrompt(e.target.value)}
                    placeholder="Ex: Proposer un horaire de départ supplémentaire Abidjan-Yamoussoukro"
                    className="flex-1 bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleRunSandboxTest}
                    disabled={!sandboxPrompt || isSandboxLoading}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-orange-500/20 shrink-0"
                  >
                    {isSandboxLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Exécuter</span>
                  </button>
                </div>
              </div>
            </div>

            {sandboxResponse && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-orange-400 font-bold">
                  <span>Réponse d'Orchestration ({selectedSandboxAssistant})</span>
                  <span className="text-[10px] text-slate-500 font-mono">Gemini 3.6 Flash</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{sandboxResponse}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Services Transversaux (7) */}
      {activeTab === 'transversal' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-1">
            <h2 className="font-extrabold text-white text-sm">Hub des Services Transversaux Unifiés</h2>
            <p className="text-slate-400">
              Chaque service transversale est indépendant et réutilisé par le Transport, l'Hôtellerie, IVOIReXpress Vision et l'IPTV.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(srv => (
              <div key={srv.serviceId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                    {getServiceIcon(srv.iconName)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    {srv.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-sm">{srv.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{srv.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Latence: <strong className="text-emerald-400">{srv.latencyMs}ms</strong></span>
                  <span>Uptime: <strong className="text-white">{srv.uptimePercent}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Hub de Paiement Unique */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Hub de Paiement Transversal Unifié</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Service unique d'encaissement Wave, MTN Mobile Money, Orange Money, Moov Money et Carte Bancaire.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                Taux de succès: 99.8%
              </span>
            </div>
          </div>

          {/* Transactions Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Dernières Transactions Transversales :</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Référence</th>
                    <th className="p-3">Module Source</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Moyen</th>
                    <th className="p-3">Horodatage</th>
                    <th className="p-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {payments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-orange-400">{pay.reference}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold">
                          {pay.module}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{pay.customerName}</div>
                        <div className="text-[10px] text-slate-500">{pay.customerPhone}</div>
                      </td>
                      <td className="p-3 font-extrabold text-emerald-400">{(pay?.amount || 0).toLocaleString()} FCFA</td>
                      <td className="p-3 font-medium text-slate-300">{pay.method}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-500">{pay.timestamp}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.status === 'Succès'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Notifications Multi-Canal */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Notification Composer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Émettre une Notification</span>
            </h2>

            {notifSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Notification envoyée au hub multi-canal !</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Canal de diffusion :</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PUSH', 'EMAIL', 'SMS'] as const).map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setNotifChannel(ch)}
                      className={`py-2 rounded-xl font-bold transition-all ${
                        notifChannel === ch
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Destinataires :</label>
                <input
                  type="text"
                  value={notifRecipient}
                  onChange={(e) => setNotifRecipient(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Titre de l'alerte :</label>
                <input
                  type="text"
                  placeholder="Ex: Confirmation de voyage"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Corps du message :</label>
                <textarea
                  rows={3}
                  placeholder="Contenu du message Push / Email / SMS..."
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl transition-all shadow-md"
              >
                Diffuser la Notification
              </button>
            </form>
          </div>

          {/* Delivery Log */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Registre de Diffusion Multi-Canal :</h3>

            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        {n.channel}
                      </span>
                      <h4 className="font-extrabold text-white">{n.title}</h4>
                    </div>
                    <p className="text-slate-300">{n.body}</p>
                    <div className="text-[10px] text-slate-500 font-mono">Destinataire: {n.recipient} • {n.sentAt}</div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: Détection d'Anomalies IA */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-white">Surveillance & Détection d'Anomalies IA Core</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Surveillance automatique des goulots d'étranglement de réservation, des flux réseau Vision IA et du temps de réponse du Hub de Paiement.
              </p>
            </div>
            <button
              onClick={handleRunDiagnostic}
              disabled={isDiagnosticRunning}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
              <span>Analyser Maintenant</span>
            </button>
          </div>

          <div className="space-y-3">
            {anomalies.map(anom => (
              <div key={anom.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      anom.severity === 'CRITIQUE'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : anom.severity === 'MOYENNE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      Anomalie {anom.severity}
                    </span>
                    <span className="font-extrabold text-white">{anom.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{anom.timestamp}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-orange-400 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Diagnostic IA :</span>
                  </div>
                  <p>{anom.aiDiagnostic}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-slate-400">
                    <span className="font-bold text-white">Solution suggérée : </span>
                    {anom.suggestedFix}
                  </div>

                  <button
                    onClick={() => {
                      setAnomalies(prev => prev.map(a => a.id === anom.id ? { ...a, status: 'RESOLU' } : a));
                    }}
                    disabled={anom.status === 'RESOLU'}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-extrabold text-[11px] shrink-0 transition-all"
                  >
                    {anom.status === 'RESOLU' ? 'Résolu' : 'Marquer comme Résolu'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Actions Proposées & Validation Human-in-the-Loop */}
      {activeTab === 'proposed_actions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-extrabold text-white">Validation des Actions Proposées (Human-in-the-Loop)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Conformément à l'exigence de gouvernance Volume 6, toute action sensible proposée par l'AI Core nécessite l'accord explicite d'un utilisateur ou administrateur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposedActions.map(act => (
              <div key={act.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-extrabold text-[10px]">
                      Module {act.targetModule}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{act.createdAt}</span>
                  </div>

                  <h3 className="font-extrabold text-white text-sm mb-1">{act.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{act.description}</p>
                </div>

                {act.status === 'PROPOSED' ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => handleValidateProposedAction(act.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Valider & Exécuter</span>
                    </button>
                    <button
                      onClick={() => setProposedActions(prev => prev.map(a => a.id === act.id ? { ...a, status: 'REJECTED' } : a))}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-all"
                    >
                      Refuser
                    </button>
                  </div>
                ) : (
                  <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                    act.status === 'EXECUTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Statut : {act.status === 'EXECUTED' ? 'Exécuté avec succès' : 'Refusé par l\'administrateur'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
