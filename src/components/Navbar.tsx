import React from 'react';
import { UserRole, TransportAgency, UserAccount } from '../types';
import { Bus, Hotel, Camera, ShieldCheck, Sparkles, User, Bell, RefreshCw, ChevronDown, LogIn, LogOut, KeyRound, Building2, UserPlus, Database } from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  agencies: TransportAgency[];
  selectedAgencyId: string;
  onAgencySelect: (agencyId: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAIChat: () => void;
  unreadAlertsCount: number;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenRegister?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  agencies,
  selectedAgencyId,
  onAgencySelect,
  activeTab,
  onTabChange,
  onOpenAIChat,
  unreadAlertsCount,
  currentUser,
  onOpenAuthModal,
  onOpenRegister,
  onLogout
}) => {
  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) || agencies[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top National Ivory Coast Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-white text-xl tracking-tighter">
              IVX
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  IVOIRe<span className="text-orange-500">Xpress</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  NG 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Transport • Hôtellerie • Vision IA • Côte d'Ivoire
              </p>
            </div>
          </div>

          {/* Role Navigation Switcher Tabs - Hidden for Voyageur */}
          {currentRole !== 'VOYAGEUR' && (
            <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => onRoleChange('VOYAGEUR')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'VOYAGEUR'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Voyageur</span>
              </button>

              <button
                onClick={() => onRoleChange('ADMIN_AGENCE')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'ADMIN_AGENCE'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Admin Agence</span>
              </button>

              <button
                onClick={() => onRoleChange('ADMIN_HOTEL')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'ADMIN_HOTEL'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Admin Hôtel</span>
              </button>

              <button
                onClick={() => onRoleChange('SUPER_ADMIN')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentRole === 'SUPER_ADMIN'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
            </div>
          )}

          {/* Right Actions & Utilities */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Access to Database (Cloud Firestore) - Super Admin Only */}
            {currentRole === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  onRoleChange('SUPER_ADMIN');
                  onTabChange('architecture');
                }}
                title="Accéder directement à la Console Base de Données Super Admin (Cloud Firestore)"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 active:scale-95 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console BDD (Super Admin)</span>
              </button>
            )}
            
            {/* If Admin Agence, show isolated agency dropdown */}
            {currentRole === 'ADMIN_AGENCE' && (
              <div className="relative group">
                <div className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer text-xs transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-slate-200 truncate max-w-[120px] sm:max-w-[160px]">
                    {selectedAgency?.name || 'Sélectionner Agence'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Changer d'agence isolée
                  </div>
                  {agencies.map(agency => (
                    <button
                      key={agency.id}
                      onClick={() => onAgencySelect(agency.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        agency.id === selectedAgencyId
                          ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{agency.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                        {agency.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAIChat}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all"
              title="Ouvrir l'assistant IA Aya"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="hidden sm:inline">Aya IA</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => onTabChange('alerts')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all relative"
                title="Alertes de sécurité IVOIReXpress Vision"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Centralized Auth Button / Active User Badge */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl">
                <img
                  src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-slate-600"
                />
                <div className="hidden md:block text-left">
                  <div className="text-[11px] font-bold text-white leading-none truncate max-w-[100px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[9px] font-semibold text-emerald-400 leading-none">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={onOpenAuthModal}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Gérer la session / Connexion"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title="Se Déconnecter"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Se Connecter</span>
                  <span className="sm:hidden">Connexion</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Créer un compte</span>
                </button>
              </div>
            )}

            {/* Role Switcher Mobile Trigger - Hidden for Voyageur */}
            {currentRole !== 'VOYAGEUR' && (
              <div className="lg:hidden">
                <select
                  value={currentRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="bg-slate-800 text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="VOYAGEUR">Voyageur</option>
                  <option value="ADMIN_AGENCE">Admin Agence</option>
                  <option value="ADMIN_HOTEL">Admin Hôtel</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
