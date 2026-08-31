import React, { useState } from 'react';
import { useHexagonalArchitecture } from '../../core/context/HexagonalArchitectureContext';
import { UserRole, UserAccount, AuthSession } from '../../types';
import { LUXURY_VIP_BUS_IMAGE } from '../../assets/welcomeAssets';
import {
  Lock,
  User,
  ShieldCheck,
  Building2,
  Bus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  ShieldAlert,
  ChevronLeft,
  Briefcase,
  Wifi,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';

interface SingleLoginPortalProps {
  isOpen?: boolean;
  isStandalonePage?: boolean;
  onClose?: () => void;
  onLoginSuccess: (session: AuthSession, targetTab: string) => void;
  currentActiveUser?: UserAccount | null;
  initialMode?: 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
}

export const SingleLoginPortal: React.FC<SingleLoginPortalProps> = ({
  isOpen = true,
  isStandalonePage = false,
  onClose,
  onLoginSuccess,
  currentActiveUser,
  initialMode = 'LOGIN'
}) => {
  const { authUseCases } = useHexagonalArchitecture();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'MFA_STEP'>(initialMode);
  const [isProMode, setIsProMode] = useState<boolean>(false);

  React.useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  // Login Form States
  const [selectedRole, setSelectedRole] = useState<'VOYAGEUR' | 'SUPER_ADMIN' | 'ADMIN_AGENCE' | 'ADMIN_HOTEL' | 'DRIVER'>('VOYAGEUR');
  const [identifier, setIdentifier] = useState<string>('koffi.voyageur@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [enableMfaChallenge, setEnableMfaChallenge] = useState<boolean>(false);

  // Traveler Registration Form States
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);

  // Forgot Password Form States
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetStep, setResetStep] = useState<'REQUEST' | 'CONFIRM'>('REQUEST');
  const [resetTokenCode, setResetTokenCode] = useState<string>('849201');
  const [newPassword, setNewPassword] = useState<string>('');

  // MFA Challenge State
  const [tempMfaToken, setTempMfaToken] = useState<string>('');
  const [mfaCode, setMfaCode] = useState<string>('849201');

  // Status and Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Toggle Pro / Traveler view
  const handleToggleProMode = (proState: boolean) => {
    setIsProMode(proState);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!proState) {
      setSelectedRole('VOYAGEUR');
      setIdentifier('koffi.voyageur@gmail.com');
      setPassword('Password123!');
    } else {
      setSelectedRole('SUPER_ADMIN');
      setIdentifier('fabriceallechi@gmail.com');
      // 🔐 SECURITY FIX: Password must be entered manually
      setPassword('');
    }
  };

  // Role Selection Handler inside Pro Mode
  const handleSelectRole = (role: 'SUPER_ADMIN' | 'ADMIN_AGENCE' | 'ADMIN_HOTEL' | 'DRIVER') => {
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (role === 'SUPER_ADMIN') {
      setIdentifier('fabriceallechi@gmail.com');
      // 🔐 SECURITY FIX: Password must be entered manually
      setPassword('');
    } else if (role === 'ADMIN_AGENCE') {
      setIdentifier('admin.utb@ivoirexpress.ci');
      setPassword('Password123!');
    } else if (role === 'ADMIN_HOTEL') {
      setIdentifier('admin.sofitel@ivoirexpress.ci');
      setPassword('Password123!');
    } else if (role === 'DRIVER') {
      setIdentifier('chauffeur.utb@ivoirexpress.ci');
      setPassword('Password123!');
    }
  };

  // Handler: Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await authUseCases.login(identifier, password);

      // Check if MFA challenge is requested explicitly
      if (enableMfaChallenge) {
        setTempMfaToken(`IVX-MFA-TEMP-${result.session.user.id}-${Date.now()}`);
        setActiveTab('MFA_STEP');
        setSuccessMsg(`Code de sécurité MFA envoyé par SMS au numéro associé.`);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(result.message);
      setTimeout(() => {
        onLoginSuccess(result.session, result.redirectTab);
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Identifiant ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Verify MFA
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await authUseCases.verifyMfaCode(tempMfaToken, mfaCode);
      setSuccessMsg(result.message);
      setTimeout(() => {
        onLoginSuccess(result.session, result.redirectTab);
        if (onClose) onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Code MFA invalide.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Register Traveler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!acceptTerms) {
      setErrorMsg("Veuillez accepter les conditions générales d'utilisation pour continuer.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authUseCases.registerTraveler(regFullName, regEmail, regPhone, regPassword);
      setSuccessMsg(result.message);
      setTimeout(() => {
        onLoginSuccess(result.session, 'home');
        if (onClose) onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la création du compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Request Password Reset
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authUseCases.requestPasswordReset(resetIdentifier);
      setSuccessMsg(res.message);
      setResetStep('CONFIRM');
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de traiter la demande de réinitialisation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Confirm Password Reset
  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authUseCases.confirmPasswordReset(resetIdentifier, resetTokenCode, newPassword);
      setSuccessMsg(res.message);
      setTimeout(() => {
        setActiveTab('LOGIN');
        setIdentifier(resetIdentifier);
        setPassword(newPassword);
        setResetStep('REQUEST');
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Échec de la réinitialisation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const portalContent = (
    <div className="max-w-4xl w-full bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl relative my-auto text-left overflow-hidden flex flex-col md:flex-row">
      {/* Top Ivory Coast Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-500 z-30" />

      {/* Close button if in modal mode */}
      {onClose && !isStandalonePage && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-md transition z-40 border border-white/20 shadow-lg"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* LEFT SIDE: ORANGE VIP BUS SHOWCASE IMAGE */}
      <div className="w-full md:w-1/2 relative bg-slate-950 flex flex-col justify-between overflow-hidden min-h-[220px] md:min-h-[520px]">
        {/* VIP Bus Background Image */}
        <img
          src={LUXURY_VIP_BUS_IMAGE}
          alt="Autocar Express VIP IVOIReXpress"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[1.05] contrast-[1.02] transform scale-105 transition-transform duration-1000 hover:scale-110"
        />
        {/* Subtle Gradient overlay for legibility of text badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/20 to-slate-950 pointer-events-none" />

        {/* Top Badge */}
        <div className="relative z-10 p-4 sm:p-6 flex items-center justify-between">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-amber-500/40 text-amber-300 text-xs font-black backdrop-blur-md shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Flotte VIP High-Tech</span>
          </div>
        </div>

        {/* Bottom Info Showcase */}
        <div className="relative z-10 p-5 sm:p-6 space-y-2 text-white">
          <div className="inline-block px-2.5 py-1 rounded-md bg-orange-500/90 text-slate-950 font-black text-[10px] uppercase tracking-widest">
            Côte d'Ivoire • Express Interurbain
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
            Voyagez en Première Classe avec IVOIReXpress
          </h2>
          <p className="text-xs text-slate-200 font-medium leading-relaxed drop-shadow max-w-sm hidden sm:block">
            Billetterie unifiée, suivi GPS en temps réel, Wi-Fi 4G à bord et réservations hôtelières intégrées.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm flex items-center space-x-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>Wi-Fi 4G gratuit</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-sm flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Sécurité vidéo</span>
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PROTOTYPE LOGIN CARD (SUNSET WARM GRADIENT) */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-[#FF4E50] via-[#FF8A00] to-[#F9D423] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden min-h-[480px]">
        {/* Subtle radial glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-orange-600/30 blur-2xl pointer-events-none" />

        {/* ALERT BANNERS */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-400/50 text-white text-xs flex items-center space-x-2.5 shadow-xl backdrop-blur-md relative z-20">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-300" />
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs flex items-center space-x-2.5 shadow-xl backdrop-blur-md relative z-20">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            <div className="font-semibold">{successMsg}</div>
          </div>
        )}

        {/* ----------------- MODE 1: TRAVELER / MAIN LOGIN (PROTOTYPE CARD) ----------------- */}
        {activeTab === 'LOGIN' && !isProMode && (
          <div className="space-y-5 my-auto relative z-10 text-center">
            {/* Prototype Logo Badge */}
            <div className="w-20 h-20 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-md flex flex-col items-center justify-center text-white shadow-xl mx-auto relative group">
              <div className="w-11 h-11 rounded-full border border-white/60 bg-white/30 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6 text-white drop-shadow" />
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase mt-0.5 text-white drop-shadow-sm">
                IVOIR
              </span>
            </div>

            {/* Prototype Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Member Login
              </h1>
              <p className="text-xs font-semibold text-white/90 mt-1 drop-shadow-xs">
                Connexion Espace Membre IVOIReXpress
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 max-w-sm mx-auto">
              {/* Username Input Pill */}
              <div className="relative bg-white/95 focus-within:bg-white text-slate-800 rounded-full border border-white/60 shadow-lg px-4 py-3 flex items-center space-x-3 transition-all duration-300">
                <User className="w-5 h-5 text-orange-500 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none"
                />
              </div>

              {/* Password Input Pill */}
              <div className="relative bg-white/95 focus-within:bg-white text-slate-800 rounded-full border border-white/60 shadow-lg px-4 py-3 flex items-center space-x-3 transition-all duration-300">
                <Lock className="w-5 h-5 text-orange-500 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm font-semibold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none px-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Checkbox Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs text-white px-2 pt-1 font-medium">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/60 bg-white/20 text-orange-600 focus:ring-orange-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="drop-shadow-sm text-white/95">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('FORGOT_PASSWORD'); setResetIdentifier(identifier); }}
                  className="text-white/90 hover:text-white italic underline underline-offset-2 transition text-xs drop-shadow-sm"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Prototype Login Pill Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-8 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-xl shadow-orange-950/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 border border-white/30 flex items-center justify-center space-x-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/20 flex flex-col space-y-2 text-center text-xs text-white/90">
              <div>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-white font-extrabold hover:underline underline-offset-2"
                >
                  Créer un compte Voyageur
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleToggleProMode(true)}
                className="w-full py-2 px-3 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white border border-white/30 text-xs font-bold flex items-center justify-center space-x-2 transition shadow-md backdrop-blur-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                <span>Espaces professionnels (Admins, Agences, Hôtels, Chauffeurs)</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- MODE 2: PROFESSIONAL ACCESS ----------------- */}
        {activeTab === 'LOGIN' && isProMode && (
          <div className="space-y-4 my-auto relative z-10">
            {/* Back button */}
            <button
              type="button"
              onClick={() => handleToggleProMode(false)}
              className="inline-flex items-center space-x-1.5 text-xs text-white/90 hover:text-white transition font-bold mb-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 text-amber-300" />
              <span>Retour à la connexion Membre</span>
            </button>

            {/* Pro Role Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-white flex items-center space-x-1.5 drop-shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Sélectionnez votre espace d'administration :</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Role: Super Admin */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('SUPER_ADMIN')}
                  className={`p-2.5 rounded-2xl border text-left transition flex items-center space-x-2 backdrop-blur-md ${
                    selectedRole === 'SUPER_ADMIN'
                      ? 'bg-slate-950 border-white text-white shadow-lg'
                      : 'bg-black/30 border-white/20 text-white/80 hover:text-white hover:bg-black/50'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${selectedRole === 'SUPER_ADMIN' ? 'text-emerald-400' : 'text-white/70'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold leading-none">Super Admin</div>
                    <div className="text-[9px] text-white/70 truncate mt-0.5">Console Nationale</div>
                  </div>
                </button>

                {/* Role: Admin Agence */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('ADMIN_AGENCE')}
                  className={`p-2.5 rounded-2xl border text-left transition flex items-center space-x-2 backdrop-blur-md ${
                    selectedRole === 'ADMIN_AGENCE'
                      ? 'bg-slate-950 border-white text-white shadow-lg'
                      : 'bg-black/30 border-white/20 text-white/80 hover:text-white hover:bg-black/50'
                  }`}
                >
                  <Bus className={`w-4 h-4 shrink-0 ${selectedRole === 'ADMIN_AGENCE' ? 'text-amber-400' : 'text-white/70'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold leading-none">Admin Agence</div>
                    <div className="text-[9px] text-white/70 truncate mt-0.5">UTB, STT, CTE</div>
                  </div>
                </button>

                {/* Role: Admin Hotel */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('ADMIN_HOTEL')}
                  className={`p-2.5 rounded-2xl border text-left transition flex items-center space-x-2 backdrop-blur-md ${
                    selectedRole === 'ADMIN_HOTEL'
                      ? 'bg-slate-950 border-white text-white shadow-lg'
                      : 'bg-black/30 border-white/20 text-white/80 hover:text-white hover:bg-black/50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 shrink-0 ${selectedRole === 'ADMIN_HOTEL' ? 'text-purple-300' : 'text-white/70'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold leading-none">Admin Hôtel</div>
                    <div className="text-[9px] text-white/70 truncate mt-0.5">Sofitel & Partenaires</div>
                  </div>
                </button>

                {/* Role: Driver */}
                <button
                  type="button"
                  onClick={() => handleSelectRole('DRIVER')}
                  className={`p-2.5 rounded-2xl border text-left transition flex items-center space-x-2 backdrop-blur-md ${
                    selectedRole === 'DRIVER'
                      ? 'bg-slate-950 border-white text-white shadow-lg'
                      : 'bg-black/30 border-white/20 text-white/80 hover:text-white hover:bg-black/50'
                  }`}
                >
                  <User className={`w-4 h-4 shrink-0 ${selectedRole === 'DRIVER' ? 'text-amber-300' : 'text-white/70'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold leading-none">Chauffeur</div>
                    <div className="text-[9px] text-white/70 truncate mt-0.5">Scan QR & Trajets</div>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-extrabold text-white mb-1 drop-shadow-xs">
                  Identifiant Pro ({selectedRole})
                </label>
                <div className="relative bg-white/95 focus-within:bg-white text-slate-800 rounded-full border border-white/60 shadow-md px-4 py-2.5 flex items-center space-x-3">
                  <User className="w-4 h-4 text-orange-500 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="ex: admin.utb@ivoirexpress.ci"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-white mb-1 drop-shadow-xs">
                  Mot de passe Pro
                </label>
                <div className="relative bg-white/95 focus-within:bg-white text-slate-800 rounded-full border border-white/60 shadow-md px-4 py-2.5 flex items-center space-x-3">
                  <Lock className="w-4 h-4 text-orange-500 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none px-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional MFA Toggle inside Pro Mode */}
              <div className="flex items-center justify-between text-xs text-white pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMfaChallenge}
                    onChange={(e) => setEnableMfaChallenge(e.target.checked)}
                    className="rounded bg-black/30 border-white/40 text-orange-600 focus:ring-orange-400"
                  />
                  <span className="text-white text-xs font-medium drop-shadow-xs">Exiger un code MFA / 2FA</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-slate-950 hover:bg-black text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-xl border border-white/30 transition disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Connexion Pro...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-amber-300" />
                    <span>Se Connecter ({selectedRole})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- MODE 3: TRAVELER REGISTER ----------------- */}
        {activeTab === 'REGISTER' && (
          <div className="space-y-3 my-auto relative z-10">
            <button
              type="button"
              onClick={() => { setActiveTab('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
              className="inline-flex items-center space-x-1.5 text-xs text-white hover:underline font-bold mb-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/20"
            >
              <ChevronLeft className="w-4 h-4 text-amber-300" />
              <span>Déjà inscrit ? Connexion Membre</span>
            </button>

            <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
              <div>
                <label className="block text-xs font-extrabold text-white mb-1">
                  Nom & Prénom Complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Koffi Konan Jean"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-2xl border border-white/60 focus:outline-none font-semibold shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-extrabold text-white mb-1">
                    Adresse E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="jean.koffi@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-2xl border border-white/60 focus:outline-none font-semibold shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-white mb-1">
                    Téléphone Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+225 07 00 11 22 33"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-2xl border border-white/60 focus:outline-none font-semibold shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-white mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 caractères"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-2xl border border-white/60 focus:outline-none font-semibold shadow-sm"
                />
              </div>

              <div className="pt-0.5">
                <label className="flex items-start space-x-2 text-[11px] text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-white/60 bg-white/20 text-orange-600 focus:ring-orange-400"
                  />
                  <span>J'accepte les conditions d'utilisation d'IVOIReXpress.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xl border border-white/30 transition disabled:opacity-50 mt-1"
              >
                {isSubmitting ? (
                  <span>Création du compte...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Créer Mon Compte Voyageur</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ----------------- MODE 4: FORGOT PASSWORD ----------------- */}
        {activeTab === 'FORGOT_PASSWORD' && (
          <div className="space-y-3 my-auto relative z-10">
            <button
              type="button"
              onClick={() => { setActiveTab('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
              className="inline-flex items-center space-x-1 text-xs text-white hover:underline font-bold mb-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/20"
            >
              <ChevronLeft className="w-4 h-4 text-amber-300" />
              <span>Retour à la connexion</span>
            </button>

            {resetStep === 'REQUEST' ? (
              <form onSubmit={handleResetRequest} className="space-y-3">
                <p className="text-xs text-white drop-shadow-xs font-medium">
                  Saisissez votre e-mail ou téléphone pour recevoir les instructions de réinitialisation.
                </p>

                <div>
                  <label className="block text-xs font-extrabold text-white mb-1">
                    E-mail ou Téléphone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: voyageur@gmail.com ou +225 07001122"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full bg-white/95 text-slate-800 text-xs px-3.5 py-2.5 rounded-full border border-white/60 focus:outline-none font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-slate-950 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xl border border-white/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      <span>Envoyer les instructions</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetConfirm} className="space-y-3">
                <div className="p-2.5 rounded-2xl bg-black/40 border border-white/30 text-white text-xs font-mono text-center">
                  Code temporaire : <strong>849201</strong>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-white mb-1">
                    Code de confirmation (6 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    value={resetTokenCode}
                    onChange={(e) => setResetTokenCode(e.target.value)}
                    className="w-full bg-white/95 text-slate-900 font-mono text-center text-sm font-bold tracking-widest py-2.5 rounded-full border border-white/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-white mb-1">
                    Nouveau Mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/95 text-slate-900 text-xs px-3.5 py-2.5 rounded-full border border-white/60 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-full bg-slate-950 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 transition border border-white/30 shadow-xl"
                >
                  {isSubmitting ? <span>Mise à jour...</span> : <span>Valider le Nouveau Mot de passe</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ----------------- MODE 5: MFA STEP ----------------- */}
        {activeTab === 'MFA_STEP' && (
          <form onSubmit={handleMfaSubmit} className="space-y-3.5 my-auto relative z-10">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/30 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/40">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-xs font-extrabold text-white">
                Double Authentification (MFA)
              </h3>
              <p className="text-[11px] text-white/80">
                Entrez le code à 6 chiffres envoyé par SMS.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full bg-white/95 text-slate-900 font-mono text-center text-xl font-black tracking-[0.4em] py-3 rounded-full border border-white/60 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-slate-950 hover:bg-black text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xl border border-white/30 transition"
            >
              {isSubmitting ? (
                <span>Vérification...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Valider et Continuer</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        {portalContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {portalContent}
    </div>
  );
};
