import React from 'react';
import { IPTVGlobalSettings } from '../../types/iptv';
import { TransportAgency } from '../../types';
import { Tv, CheckCircle2, Lock, Radio, Activity, Bus, ShieldCheck, Users } from 'lucide-react';

interface AgencyAdminIPTVProps {
  agency: TransportAgency;
  settings: IPTVGlobalSettings;
}

export const AgencyAdminIPTV: React.FC<AgencyAdminIPTVProps> = ({ agency, settings }) => {
  const isGlobalEnabled = settings.moduleEnabled;
  const isAgencyAllowed = settings.agencyAccess[agency.id] ?? true;
  const isFullyActive = isGlobalEnabled && isAgencyAllowed;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 text-slate-100">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Module IPTV • Flotte {agency.name}</h2>
            <p className="text-xs text-slate-400">
              Service de divertissement numérique pour les voyageurs à bord des autocars {agency.name}.
            </p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center space-x-2 shadow-lg ${
          isFullyActive
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {isFullyActive ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>{isFullyActive ? 'SERVICE IPTV ACTIF & OPERATIONNEL' : 'SERVICE IPTV DESACTIVE'}</span>
        </div>
      </div>

      {/* STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-xs font-bold text-slate-400">Autorisation Super Admin</div>
          <div className="text-sm font-extrabold text-white flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isAgencyAllowed ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>{isAgencyAllowed ? 'Accès Flotte Autorisé' : 'Accès Restreint'}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {isAgencyAllowed
              ? 'Votre agence bénéficie du bouquet multimédia complet IVOIReXpress.'
              : 'Veuillez contacter le Super Admin pour activer l\'IPTV.'}
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-xs font-bold text-slate-400">Voyageurs Actifs en Streaming</div>
          <div className="text-2xl font-black text-orange-400">
            {isFullyActive ? '348 Passagers' : '0 Passager'}
          </div>
          <p className="text-[11px] text-slate-500">Connectés sur le Wi-Fi des autocars de ligne.</p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <div className="text-xs font-bold text-slate-400">Qualité du Débit Flotte</div>
          <div className="text-sm font-extrabold text-emerald-400 flex items-center space-x-1.5">
            <Activity className="w-4 h-4" />
            <span>CDN 1080p Ultra Fluide</span>
          </div>
          <p className="text-[11px] text-slate-500">Serveur tampon auto-adaptatif par bus.</p>
        </div>

      </div>

      {/* NOTICE BOX */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2">
        <div className="font-extrabold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Note de Gestion - Droits d'Administration</span>
        </div>
        <p className="leading-relaxed">
          Conformément au cahier des charges, la gestion des chaînes, des catégories, des logos et des playlists M3U est exclusivement centralisée par le Super Admin IVOIReXpress. L'Admin Agence consulte les paramètres de service autorisés pour sa flotte.
        </p>
      </div>

    </div>
  );
};
