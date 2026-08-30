import React from 'react';
import { UserRole, UserAccount } from '../../types';
import { ShieldAlert, LogIn, Lock, ArrowRight, Bus, Building2, ShieldCheck, User } from 'lucide-react';

interface ProtectedRouteProps {
  currentUser: UserAccount | null;
  allowedRoles: UserRole[];
  workspaceName: string;
  onOpenPortal: () => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  currentUser,
  allowedRoles,
  workspaceName,
  onOpenPortal,
  children
}) => {
  // Check if authenticated and authorized
  const isAuthenticated = !!currentUser;
  const isAuthorized = isAuthenticated && allowedRoles.includes(currentUser.role);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            Authentification Obligatoire • Portail Unique
          </span>
          <h2 className="text-2xl font-black text-white">
            Accès Protégé : {workspaceName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Pour accéder à cet espace de travail professionnel IVOIReXpress, vous devez d'abord vous identifier sur le <strong className="text-amber-400">Portail de Connexion Unique</strong> avec un compte habilité.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs font-mono text-slate-400">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span>Module Métier :</span>
            <span className="text-amber-400 font-bold">{workspaceName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Rôles Autorisés :</span>
            <span className="text-emerald-400 font-bold">{allowedRoles.join(', ')}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenPortal}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-slate-950 font-black text-xs inline-flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/20 hover:brightness-110 active:scale-95 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Ouvrir le Portail de Connexion Unique</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            Violations des Droits RBAC • Accès Refusé
          </span>
          <h2 className="text-2xl font-black text-white">
            Privilèges Insuffisants
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Votre compte actuel (<strong className="text-rose-400">{currentUser.fullName}</strong> - Rôle: <strong className="text-white">{currentUser.role}</strong>) ne possède pas les autorisations nécessaires pour accéder à l'espace <strong className="text-white">{workspaceName}</strong>.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2 text-xs font-mono text-slate-400">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span>Utilisateur Connecté :</span>
            <span className="text-white font-bold">{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Niveau de Sécurité Requis :</span>
            <span className="text-rose-400 font-bold">{allowedRoles.join(' / ')}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenPortal}
            className="px-8 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm inline-flex items-center space-x-2 border border-slate-700 transition"
          >
            <LogIn className="w-4 h-4 text-orange-400" />
            <span>Changer de Compte sur le Portail Unique</span>
          </button>
        </div>
      </div>
    );
  }

  // Authorized -> Render protected workspace
  return <>{children}</>;
};
