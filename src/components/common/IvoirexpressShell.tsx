import React, { useState } from 'react';
import { UserRole, UserAccount } from '../../types';
import { 
  Bus, 
  Hotel, 
  Eye, 
  Tv, 
  Home, 
  User, 
  Bell, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Ticket, 
  Wallet, 
  Settings, 
  HelpCircle, 
  History, 
  KeyRound, 
  Building2, 
  ChevronRight,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Palette,
  Grid,
  Bed,
  Calendar,
  ShieldAlert,
  Database
} from 'lucide-react';
import { IxBadge, IxButton } from './IvoirexpressUIKit';
import { resetScrollToTop } from '../../lib/navigationScroll';

export interface SystemToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface IvoirexpressShellProps {
  children: React.ReactNode;
  currentRole: UserRole;
  currentUser: UserAccount | null;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onRoleSwitch: (role: UserRole) => void;
  onOpenAuthModal: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  onOpenTicketsWallet?: () => void;
  bookingStep?: number | null;
  onExitBooking?: () => void;
}

export const IvoirexpressShell: React.FC<IvoirexpressShellProps> = ({
  children,
  currentRole,
  currentUser,
  activeTab,
  onTabChange,
  onRoleSwitch,
  onOpenAuthModal,
  onOpenRegister,
  onLogout,
  unreadNotificationsCount = 3,
  onOpenTicketsWallet,
  bookingStep = null,
  onExitBooking
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample System Notifications
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Billet Départ Imminent', desc: 'Car Abidjan → Bouaké (14h30) embarquement dans 30 min.', time: 'Il y a 10 min', read: false },
    { id: '2', title: 'Alerte Sécurité Vision IA', desc: 'Détection somnolence contrôlée - Car UTB-094. Statut RAS.', time: 'Il y a 1h', read: false },
    { id: '3', title: 'Confirmation Réservation Hôtel', desc: 'Sofitel Abidjan - Suite Executive confirmée.', time: 'Hier', read: true },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Booking Steps Definition (Specification 2026)
  const BOOKING_STEPS = [
    { step: 1, label: 'Recherche' },
    { step: 2, label: 'Choix du trajet' },
    { step: 3, label: 'Sélection du siège' },
    { step: 4, label: 'Informations' },
    { step: 5, label: 'Paiement' },
    { step: 6, label: 'Confirmation' },
  ];

  // Role Badges for IVOIReXpress Design System
  const roleBadges: Record<UserRole, { label: string; variant: 'amber' | 'blue' | 'purple' | 'emerald'; icon: any }> = {
    VOYAGEUR: { label: 'Espace Voyageur', variant: 'amber', icon: User },
    ADMIN_AGENCE: { label: 'Admin Agence Bus', variant: 'blue', icon: Bus },
    ADMIN_HOTEL: { label: 'Admin Hôtel', variant: 'purple', icon: Hotel },
    SUPER_ADMIN: { label: 'Super Admin National', variant: 'emerald', icon: ShieldCheck }
  };

  const currentRoleBadge = roleBadges[currentRole];

  // Role-based Navigation Drawer Links
  const getDrawerItems = () => {
    if (currentRole === 'VOYAGEUR') {
      return [
        { id: 'home', label: 'Accueil & Services', icon: Home, badge: 'Hub' },
        { id: 'transport', label: 'Billetterie Bus & Trajets', icon: Bus, badge: 'Bus' },
        { id: 'hotels', label: 'Réservation Hôtelière', icon: Hotel, badge: 'Hôtels' },
        { id: 'vision', label: 'Caméras & Sécurité', icon: Eye, badge: 'Direct' },
        { id: 'iptv', label: 'Chaînes TV & Vidéos', icon: Tv, badge: 'Médias' },
        { id: 'design-system', label: 'Guide & Thème Visuel', icon: Palette, badge: 'Style' },
        { id: 'tickets', label: 'Mes Billets & QR Codes', icon: Ticket, action: onOpenTicketsWallet },
        { id: 'wallet', label: 'Mon Portefeuille Mobile', icon: Wallet },
        { id: 'history', label: 'Historique de Séjours', icon: History }
      ];
    } else if (currentRole === 'ADMIN_AGENCE') {
      return [
        { id: 'agency-dash', label: 'Console Agence (20 Cartes)', icon: Home },
        { id: 'agency-lines', label: 'Lignes & Départs Bus', icon: Bus },
        { id: 'agency-fleet', label: 'Flotte Autocars', icon: Bus },
        { id: 'agency-drivers', label: 'Conducteurs & Chauffeurs', icon: User },
        { id: 'agency-scanner', label: 'Scanner Billet & QR', icon: Ticket },
        { id: 'agency-vision', label: 'Caméras & Vision IA', icon: Eye },
        { id: 'agency-iptv', label: 'Catalogue IPTV Embarqué', icon: Tv },
        { id: 'agency-audit', label: 'Analytics & Journaux', icon: ShieldCheck },
        { id: 'design-system', label: 'Design System Officiel', icon: Palette, badge: 'UI' }
      ];
    } else if (currentRole === 'ADMIN_HOTEL') {
      return [
        { id: 'hotel-dash', label: 'Console Hôtel (Cartes)', icon: Home },
        { id: 'hotel-profile', label: 'Profil Établissement', icon: Building2 },
        { id: 'hotel-rooms', label: 'Chambres & Tarification', icon: Bed },
        { id: 'hotel-bookings', label: 'Réservations & Check-in', icon: Calendar },
        { id: 'hotel-audit', label: 'Journaux d\'Audit', icon: ShieldCheck },
        { id: 'design-system', label: 'Design System Officiel', icon: Palette, badge: 'UI' }
      ];
    } else {
      return [
        { id: 'super-dash', label: 'Console Nationale (20 Cartes)', icon: Grid },
        { id: 'super-settings', label: 'Paramétrage & Sync Global', icon: Settings },
        { id: 'super-users', label: 'Gestion des Rôles & RBAC', icon: User },
        { id: 'super-agencies', label: 'Compagnies & Agences', icon: Building2 },
        { id: 'super-hotels', label: 'Réseau Hôtelier', icon: Hotel },
        { id: 'super-vision', label: 'Vidéosurveillance Vision', icon: Eye },
        { id: 'super-iptv', label: 'Supervision IPTV Globale', icon: Tv },
        { id: 'super-ai', label: 'AI Core & Gemini 2.5', icon: Sparkles },
        { id: 'super-kpis', label: 'KPIs & Bilans Nationaux', icon: Layers },
        { id: 'super-logs', label: 'Journaux d\'Audit Sécurité', icon: ShieldAlert },
        { id: 'super-bdd', label: 'Console Base de Données', icon: Database },
        { id: 'design-system', label: 'Design System Officiel', icon: Palette, badge: 'UI' }
      ];
    }
  };

  const drawerItems = getDrawerItems();

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#1F2937] flex flex-col font-sans selection:bg-[#FFE7D1] selection:text-[#9A3412] relative">
      
      {/* ================= 1. HEADER (NORMAL HEADER OR BOOKING WIZARD REPLACEMENT) ================= */}
      {bookingStep ? (
        /* BOOKING PROCESS HEADER REPLACEMENT (SPECIFICATION 2026) */
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 shrink-0">
            {onExitBooking && (
              <button
                onClick={onExitBooking}
                className="p-2 rounded-[12px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] transition-all flex items-center space-x-1.5 text-xs font-semibold"
                title="Quitter la réservation"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Quitter</span>
              </button>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black text-[#1F2937]">
                Réservation de Billet
              </span>
            </div>
          </div>

          {/* 6-step Progress Bar */}
          <div className="flex-1 max-w-3xl mx-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-[500px]">
              {BOOKING_STEPS.map((s, idx) => {
                const isDone = bookingStep > s.step;
                const isActive = bookingStep === s.step;

                return (
                  <React.Fragment key={s.step}>
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        isDone
                          ? 'bg-[#22C55E] text-white'
                          : isActive
                          ? 'bg-[#F5821F] text-white ring-4 ring-[#FFE7D1]'
                          : 'bg-[#E5E7EB] text-[#6B7280]'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                      </div>
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${
                        isActive ? 'text-[#F5821F]' : isDone ? 'text-[#166534]' : 'text-[#9CA3AF]'
                      }`}>
                        {s.label}
                      </span>
                    </div>

                    {idx < BOOKING_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 transition-all ${
                        bookingStep > s.step ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-[#6B7280]">Étape {bookingStep}/6</span>
          </div>
        </header>
      ) : (
        /* STANDARD OFFICIAL HEADER - 100% PERMANENTLY FIXED AT TOP */
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] text-[#1F2937] h-16 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          
          {/* Left: Hamburger menu + Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-[12px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] transition-all active:scale-95 lg:hidden"
              title="Ouvrir le Menu Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo Brand without bus icon */}
            <div 
              onClick={() => {
                onTabChange('home');
                resetScrollToTop();
              }}
              className="flex items-center cursor-pointer group select-none py-1"
            >
              <div className="text-left">
                <div className="text-lg sm:text-xl font-black tracking-tight text-[#1F2937] flex items-center leading-none">
                  <span>IVOIR</span>
                  <span className="text-[#F5821F] ml-0.5">Express</span>
                </div>
                <div className="text-[10px] text-[#6B7280] font-semibold leading-none mt-1">Hub National CI</div>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un trajet, un hôtel, une caméra ou IPTV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-[12px] bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#F5821F] transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Right: Role Switcher, Notifications & User Avatar with Green Dot */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Role Selector - Hidden for Voyageur */}
            {currentRole !== 'VOYAGEUR' && (
              <div className="hidden lg:flex items-center space-x-1 bg-[#F3F4F6] p-1 rounded-[12px] border border-[#E5E7EB] text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#6B7280] px-2">Rôle :</span>
                {(['VOYAGEUR', 'ADMIN_AGENCE', 'ADMIN_HOTEL', 'SUPER_ADMIN'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleSwitch(r)}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold uppercase transition-all ${
                      currentRole === r 
                        ? 'bg-[#F5821F] text-white shadow-xs' 
                        : 'text-[#4B5563] hover:text-[#1F2937] hover:bg-white'
                    }`}
                  >
                    {r === 'ADMIN_AGENCE' ? 'Agence' : r === 'ADMIN_HOTEL' ? 'Hôtel' : r === 'SUPER_ADMIN' ? 'Admin' : 'Voyageur'}
                  </button>
                ))}
              </div>
            )}

            {/* Notifications Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-[12px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] transition-all"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-[#4B5563]" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EF4444] rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <>
                  {/* Backdrop overlay for quick dismissal */}
                  <div 
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs sm:bg-transparent"
                    onClick={() => setNotificationsOpen(false)}
                  />

                  <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2.5 w-auto sm:w-96 max-w-md mx-auto sm:mx-0 bg-white border border-[#E5E7EB] rounded-[20px] shadow-2xl z-50 overflow-hidden text-[#1F2937]">
                    <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-[#F5821F]" />
                        <span className="font-extrabold text-xs text-[#1F2937] uppercase tracking-wider">Notifications Système</span>
                        {notifications.some(n => !n.read) && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold">
                            {notifications.filter(n => !n.read).length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={markAllRead} 
                          className="text-[11px] text-[#F5821F] font-bold hover:underline"
                        >
                          Tout marquer lu
                        </button>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#1F2937] hover:bg-[#E5E7EB] transition-colors"
                          title="Fermer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[65vh] sm:max-h-80 overflow-y-auto divide-y divide-[#E5E7EB]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#9CA3AF]">
                          Aucune notification pour le moment.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-3.5 hover:bg-[#F8FAFC] transition-colors ${!n.read ? 'bg-[#FFE7D1]/30' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-xs text-[#1F2937] leading-tight">{n.title}</span>
                              <span className="text-[10px] text-[#9CA3AF] shrink-0 font-medium">{n.time}</span>
                            </div>
                            <p className="text-xs text-[#6B7280] mt-1 leading-normal">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Avatar with Presence Dot (+10% horizontal size) */}
            {currentUser ? (
              <div className="flex items-center space-x-3 px-3 py-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[14px]">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#FFE7D1] text-[#9A3412] font-extrabold text-xs flex items-center justify-center border border-[#FDBA74] shadow-xs">
                    {currentUser.fullName ? currentUser.fullName.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] rounded-full ring-2 ring-white" title="En ligne" />
                </div>
                <div className="hidden sm:block text-left min-w-[95px]">
                  <div className="text-xs font-bold text-[#1F2937] truncate max-w-[135px]">{currentUser.fullName}</div>
                  <div className="text-[10px] text-[#22C55E] font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
                    <span>En ligne</span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-[10px] bg-white hover:bg-[#FEF2F2] hover:text-[#EF4444] text-[#6B7280] border border-[#E5E7EB] transition-all ml-1 shrink-0"
                  title="Se Déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-[14px] bg-[#F5821F] text-white font-bold text-xs hover:bg-[#E07317] transition-all shadow-xs"
                >
                  Connexion
                </button>
                <button
                  onClick={onOpenRegister}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-[14px] bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#1F2937] border border-[#E5E7EB] text-xs font-semibold transition-all"
                >
                  S'inscrire
                </button>
              </div>
            )}

          </div>

        </header>
      )}

      {/* ================= 2. MAIN LAYOUT WITH SIDEBAR & CONTENT ================= */}
      <div className="pt-16 flex-1 flex relative w-full max-w-full min-w-0">
        
        {/* DESKTOP PERMANENT SIDEBAR */}
        <aside className="hidden lg:block w-64 bg-white border-r border-[#D1D5DB] p-4 space-y-6 shrink-0 shadow-sm sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          
          {/* Active Role Card */}
          <div className="p-3.5 rounded-[14px] bg-[#F8FAFC] border border-[#D1D5DB] space-y-2">
            <div className="text-[10px] font-semibold uppercase text-[#6B7280] tracking-wider">Espace Actif</div>
            <div className="flex items-center space-x-2">
              <IxBadge variant={currentRoleBadge.variant} icon={currentRoleBadge.icon}>
                {currentRoleBadge.label}
              </IxBadge>
            </div>
          </div>

          {/* Navigation Category Header */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] px-3 pb-2">
              Menu Navigation
            </div>

            {drawerItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      onTabChange(item.id);
                      resetScrollToTop();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[12px] text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0F4C81] text-white font-semibold shadow-sm'
                      : 'text-[#1F2937] hover:bg-[#EEF2F7] hover:text-[#0F4C81]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#0F4C81]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-[#0F4C81]' : 'bg-[#EEF2F7] text-[#6B7280]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Platform Status Notice */}
          <div className="pt-6 border-t border-[#D1D5DB]">
            <div className="p-3 rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] text-[#16A34A] space-y-1">
              <div className="font-semibold flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Statut Réseau OK</span>
              </div>
              <p className="text-[10px] text-[#6B7280]">Tous les services de réservation et direct sont disponibles.</p>
            </div>
          </div>

        </aside>

        {/* MOBILE SLIDE-OVER DRAWER MENU */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-white border-r border-[#D1D5DB] p-6 flex flex-col justify-between z-10 shadow-2xl text-[#1F2937]">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#D1D5DB]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#1F2937] text-sm">IVOIReXpress Menu</span>
                  </div>
                  <button onClick={() => setMobileDrawerOpen(false)} className="p-2 rounded-[10px] bg-[#EEF2F7] text-[#6B7280]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {drawerItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.action) {
                            item.action();
                          } else {
                            onTabChange(item.id);
                            resetScrollToTop();
                          }
                          setMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[12px] text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#0F4C81] text-white'
                            : 'text-[#1F2937] hover:bg-[#EEF2F7]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentUser && (
                <div className="pt-4 border-t border-[#D1D5DB]">
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full py-2.5 rounded-[12px] bg-[#FEF2F2] text-[#DC2626] font-semibold text-xs flex items-center justify-center space-x-2 border border-[#FECACA]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT AREA */}
        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 min-w-0 w-full max-w-full overflow-x-hidden bg-[#F8FAFC] outline-none">
          {children}
        </main>

      </div>

      {/* ================= 3. PERMANENT BOTTOM NAVIGATION BAR (OFFICIAL DESIGN SYSTEM SPEC) ================= */}
      {currentRole === 'VOYAGEUR' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] px-3 py-2 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
          {[
            { id: 'home', label: 'Accueil', icon: Home },
            { id: 'transport', label: 'Transport', icon: Bus },
            { id: 'hotels', label: 'Hôtels', icon: Hotel },
            { id: 'vision', label: 'Vision', icon: Eye },
            { id: 'tickets', label: 'Profil', icon: User, action: onOpenTicketsWallet },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    onTabChange(item.id);
                    resetScrollToTop();
                  }
                }}
                className={`flex flex-col items-center space-y-1 px-3 py-1 rounded-[12px] transition-colors ${
                  isActive ? 'text-[#F5821F] font-bold' : 'text-[#6B7280] font-medium hover:text-[#1F2937]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F5821F]' : 'text-[#6B7280]'}`} />
                <span className="text-[11px] leading-none">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 bg-[#F5821F] rounded-full mt-0.5" />}
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
};
