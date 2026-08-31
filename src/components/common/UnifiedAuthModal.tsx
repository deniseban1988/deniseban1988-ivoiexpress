import React, { useState } from 'react';
import { useHexagonalArchitecture } from '../../core/context/HexagonalArchitectureContext';
import { UserRole, UserAccount, AuthSession } from '../../types';
import {
  Lock,
  User,
  ShieldCheck,
  Building2,
  Bus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Mail,
  UserPlus,
  LogIn,
  ShieldAlert,
  Info
} from 'lucide-react';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession, targetTab: string) => void;
  currentActiveUser?: UserAccount | null;
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentActiveUser,
  initialMode = 'LOGIN'
}) => {
  const { authUseCases } = useHexagonalArchitecture();

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Form states for login
  const [identifier, setIdentifier] = useState<string>('koffi.voyageur@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form states for traveler registration
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await authUseCases.login(identifier, password);
      setSuccessMsg(result.message);
      setTimeout(() => {
        onLoginSuccess(result.session, result.redirectTab);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur d'authentification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await authUseCases.registerTraveler(regFullName, regEmail, regPhone, regPassword);
      setSuccessMsg(result.message);
      setTimeout(() => {
        onLoginSuccess(result.session, 'home');
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Fast-Login buttons
  const handleQuickDemoLogin = async (demoEmail: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    
    // 🔐 SECURITY: Super Admin must always type their password.
    if (demoEmail === 'fabriceallechi@gmail.com') {
      setIdentifier(demoEmail);
      setPassword('');
      setErrorMsg("Sécurité : Le mot de passe Super Admin ne peut pas être pré-rempli. Veuillez le saisir manuellement.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authUseCases.login(demoEmail, 'Password123!');
      setSuccessMsg(`Connexion rapide sous ${result.session.user.fullName}`);
      setTimeout(() => {
        onLoginSuccess(result.session, result.redirectTab);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative">
        
        {/* Top Header Decor */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-emerald-400 to-blue-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Système d'Authentification IVOIReXpress</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {authMode === 'LOGIN' ? 'Connexion Centralisée' : 'Inscription Voyageur'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Un seul point d'accès. Redirection automatique selon le rôle (Super Admin, Admin Agence, Admin Hôtel, Voyageur).
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => { setAuthMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                authMode === 'LOGIN'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Se Connecter</span>
            </button>
            <button
              onClick={() => { setAuthMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                authMode === 'REGISTER'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nouveau Voyageur</span>
            </button>
          </div>

          {/* Quick Demo Credentials Panel */}
          {authMode === 'LOGIN' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Accès Rapides de Démonstration (Tester les 4 Rôles)</span>
                <span className="text-orange-400">1-Clic</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  onClick={() => handleQuickDemoLogin('fabriceallechi@gmail.com')}
                  className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-left transition-all group"
                >
                  <div className="text-[11px] font-black text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">fabriceallechi@gmail.com</div>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('admin.utb@ivoirexpress.ci')}
                  className="p-2 rounded-xl bg-blue-950/40 border border-blue-500/30 hover:bg-blue-900/40 text-left transition-all group"
                >
                  <div className="text-[11px] font-black text-blue-400 flex items-center space-x-1">
                    <Bus className="w-3 h-3" />
                    <span>Admin Agence UTB</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">admin.utb@ivoirexpress.ci</div>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('admin.sofitel@ivoirexpress.ci')}
                  className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40 text-left transition-all group"
                >
                  <div className="text-[11px] font-black text-purple-400 flex items-center space-x-1">
                    <Building2 className="w-3 h-3" />
                    <span>Admin Hôtel Sofitel</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">admin.sofitel@ivoirexpress.ci</div>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('koffi.voyageur@gmail.com')}
                  className="p-2 rounded-xl bg-orange-950/40 border border-orange-500/30 hover:bg-orange-900/40 text-left transition-all group"
                >
                  <div className="text-[11px] font-black text-orange-400 flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>Voyageur</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">koffi.voyageur@gmail.com</div>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center space-x-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authMode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-300">
                  Adresse E-mail ou Numéro de Téléphone
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ex: voyageur@gmail.com ou 0707070707"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Mot de passe
                  </label>
                  <span className="text-[10px] text-slate-500">Chiffrement AES-256</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span>Vérification de la session...</span>
                ) : (
                  <>
                    <span>Se Connecter au Système</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authMode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="ex: Yao Armand"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Adresse E-mail</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yao@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Téléphone Mobile</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+225 0707..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Créer un Mot de passe</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-lg flex items-center justify-center space-x-2 mt-2"
              >
                {isSubmitting ? (
                  <span>Création du compte...</span>
                ) : (
                  <>
                    <span>Valider mon Inscription Voyageur</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Safeguard Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Protections anti-force brute (5 essais max)</span>
            </span>
            <span className="font-bold text-slate-400">IVOIReXpress RBAC 2.0</span>
          </div>

        </div>
      </div>
    </div>
  );
};
