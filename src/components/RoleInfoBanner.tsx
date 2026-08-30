import React from 'react';
import { UserRole } from '../types';
import { User, Bus, ShieldCheck, Lock, Eye, Building2, Ticket, Smartphone } from 'lucide-react';

interface RoleInfoBannerProps {
  currentRole: UserRole;
  selectedAgencyName?: string;
}

export const RoleInfoBanner: React.FC<RoleInfoBannerProps> = ({ currentRole, selectedAgencyName }) => {
  if (currentRole === 'VOYAGEUR') {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur text-slate-300 py-2.5 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
        
        {/* Role Identity Badge */}
        <div className="flex items-center space-x-2.5">
          {currentRole === 'VOYAGEUR' && (
            <div className="flex items-center space-x-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-1 rounded-md font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Espace Voyageur Grand Public</span>
            </div>
          )}

          {currentRole === 'ADMIN_AGENCE' && (
            <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md font-semibold">
              <Bus className="w-3.5 h-3.5" />
              <span>Espace Agence Isolé : {selectedAgencyName || 'UTB Express'}</span>
            </div>
          )}

          {currentRole === 'SUPER_ADMIN' && (
            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Espace Super Admin National (Global Governance)</span>
            </div>
          )}

          <span className="hidden lg:inline text-slate-500">|</span>

          {/* Quick Specifications Scope Statement */}
          <div className="text-slate-400 text-[11px] hidden sm:block">
            {currentRole === 'VOYAGEUR' && (
              <span>
                Réservation de billets de bus • Séjours Hôtels • Portefeuille QR Codes • Vidéosurveillance Personnelle
              </span>
            )}
            {currentRole === 'ADMIN_AGENCE' && (
              <span>
                Isolation Multi-Tenant • Flotte Autocars • Horaires & Tarifs • Validation Scanneur Billets
              </span>
            )}
            {currentRole === 'SUPER_ADMIN' && (
              <span>
                Supervision Nationale • Création d'Agences & Hôtels • Registre d'Audit RBAC • Grille Vision IA
              </span>
            )}
          </div>
        </div>

        {/* Security & Multi-tenant status badge */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1 text-emerald-400 font-mono">
            <Lock className="w-3 h-3" />
            <span>Sécurité RBAC & Chiffrement Actifs</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400 font-mono hidden md:flex">
            <Smartphone className="w-3 h-3 text-orange-400" />
            <span>Paiements Mobile Money CI (Wave, MTN, Orange)</span>
          </div>
        </div>

      </div>
    </div>
  );
};
