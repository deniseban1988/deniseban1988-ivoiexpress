import React from 'react';
import { Home, Bus, Hotel, Eye, Tv, Ticket, Sparkles, Database } from 'lucide-react';
import { resetScrollToTop } from '../../lib/navigationScroll';

interface ServiceSectionBarProps {
  activeTab: 'home' | 'transport' | 'hotels' | 'vision' | 'iptv' | 'bdd';
  onTabChange: (tab: any) => void;
  ticketCount?: number;
  onOpenTicketsWallet?: () => void;
}

export const ServiceSectionBar: React.FC<ServiceSectionBarProps> = ({
  activeTab,
  onTabChange,
  ticketCount = 0,
  onOpenTicketsWallet
}) => {
  const services = [
    {
      id: 'home' as const,
      label: 'Accueil',
      badge: 'Hub',
      icon: Home,
      color: 'from-orange-500 to-amber-500',
      borderColor: 'border-orange-500/50',
      textColor: 'text-orange-400'
    },
    {
      id: 'transport' as const,
      label: 'Transport Routier',
      badge: 'Billets QR',
      icon: Bus,
      color: 'from-orange-500 to-amber-600',
      borderColor: 'border-orange-500/50',
      textColor: 'text-orange-400'
    },
    {
      id: 'hotels' as const,
      label: 'Hôtellerie Partenaire',
      badge: 'Hôtels 3★–5★',
      icon: Hotel,
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500/50',
      textColor: 'text-emerald-400'
    },
    {
      id: 'vision' as const,
      label: 'IVOIReXpress Vision',
      badge: 'Sécurité IA',
      icon: Eye,
      color: 'from-blue-500 to-cyan-600',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-400'
    },
    {
      id: 'iptv' as const,
      label: 'Divertissement IPTV',
      badge: 'Streaming',
      icon: Tv,
      color: 'from-purple-500 to-indigo-600',
      borderColor: 'border-purple-500/50',
      textColor: 'text-purple-400'
    }
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-16 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 gap-4 overflow-x-auto no-scrollbar">
          
          {/* Section Bar Title Badge (Desktop) */}
          <div className="hidden xl:flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-slate-400 border-r border-slate-800 pr-4 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Services</span>
          </div>

          {/* List of 5 Core Services */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            {services.map((service) => {
              const Icon = service.icon;
              const isActive = activeTab === service.id;

              return (
                <button
                  key={service.id}
                  onClick={() => {
                    onTabChange(service.id);
                    resetScrollToTop();
                  }}
                  className={`group relative flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? `bg-slate-800 text-white shadow-xl border ${service.borderColor}`
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/80'
                  }`}
                >
                  {/* Icon with background glow if active */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${service.color} text-slate-950 shadow-md`
                        : 'bg-slate-800 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Label */}
                  <span className={isActive ? 'font-extrabold text-white' : ''}>
                    {service.label}
                  </span>

                  {/* Badge */}
                  <span
                    className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? `${service.textColor} bg-slate-900 ${service.borderColor}`
                        : 'text-slate-500 bg-slate-900 border-slate-800'
                    }`}
                  >
                    {service.badge}
                  </span>

                  {/* Bottom Active Glow Line */}
                  {isActive && (
                    <span className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r ${service.color}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Access to Tickets Wallet */}
          {onOpenTicketsWallet && (
            <button
              onClick={onOpenTicketsWallet}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 font-bold text-xs flex items-center space-x-2 shadow-md shrink-0 transition-all ml-auto"
            >
              <Ticket className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Mes Billets ({ticketCount})</span>
              <span className="sm:hidden">({ticketCount})</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
