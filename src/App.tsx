import React, { useState, useMemo } from 'react';
import { UserRole, TransportAgency, BusTrip, Vehicle, Driver, TicketBooking, Hotel, HotelRoom, HotelBooking, Camera, VisionAlert, AuditLog } from './types';
import {
  INITIAL_AGENCIES,
  INITIAL_TRIPS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_HOTELS,
  INITIAL_ROOMS,
  INITIAL_CAMERAS,
  INITIAL_VISION_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BOOKINGS,
  INITIAL_HOTEL_BOOKINGS
} from './data/mockData';

import {
  INITIAL_IPTV_CONTENTS,
  INITIAL_IPTV_PLAYLISTS,
  INITIAL_IPTV_PROVIDERS,
  INITIAL_IPTV_SETTINGS,
  INITIAL_IPTV_NOTIFICATIONS,
  INITIAL_WATCH_HISTORY
} from './data/iptvMockData';

import {
  IPTVContentItem,
  IPTVPlaylist,
  IPTVProvider,
  IPTVGlobalSettings,
  IPTVNotification,
  IPTVWatchHistoryItem
} from './types/iptv';

import { Navbar } from './components/Navbar';
import { RoleInfoBanner } from './components/RoleInfoBanner';
import { TransportBooking } from './components/traveler/TransportBooking';
import { HotelBookingView } from './components/traveler/HotelBookingView';
import { PersonalVision } from './components/traveler/PersonalVision';
import { TravelerIPTV } from './components/iptv/TravelerIPTV';
import { MyTicketsModal } from './components/traveler/MyTicketsModal';
import { AgencyDashboard } from './components/agency/AgencyDashboard';
import { HotelAdminDashboard } from './components/hoteladmin/HotelAdminDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { CreateHotelParams } from './core/ports/hotel.ports';
import { CreateAgencyParams } from './core/ports/transport.ports';
import { AICoreDrawer } from './components/ai/AICoreDrawer';
import { VisionAIModal } from './components/ai/VisionAIModal';
import { SingleLoginPortal } from './components/common/SingleLoginPortal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LandingPage } from './components/common/LandingPage';
import { ServiceSectionBar } from './components/common/ServiceSectionBar';
import { IvoirexpressShell } from './components/common/IvoirexpressShell';
import { IvoirexpressDesignSystemShowcase } from './components/common/IvoirexpressUIKit';
import { ArchitectureDocsViewer } from './components/common/ArchitectureDocsViewer';
import { HexagonalProvider, useHexagonalArchitecture } from './core/context/HexagonalArchitectureContext';
import { BannersProvider } from './core/context/BannersContext';
import { IPTVProviderComponent } from './core/context/IPTVContext';
import { SynchronizedBannersBar } from './components/common/SynchronizedBannersBar';
import { AuthSession, UserAccount } from './types';
import { useScrollToTopOnNav, resetScrollToTop } from './lib/navigationScroll';

import { Bus, Hotel as HotelIcon, Eye, Ticket, ShieldCheck, Sparkles, HeartHandshake, Tv, Home } from 'lucide-react';

function AppContent() {
  const { authUseCases, hotelUseCases, transportUseCases } = useHexagonalArchitecture();

  // Global State
  const [currentRole, setCurrentRole] = useState<UserRole>('VOYAGEUR');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [activeBookingStep, setActiveBookingStep] = useState<number | null>(null);

  const [agencies, setAgencies] = useState<TransportAgency[]>(INITIAL_AGENCIES);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(INITIAL_AGENCIES[0].id);
  const [trips, setTrips] = useState<BusTrip[]>(INITIAL_TRIPS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [hotels, setHotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [rooms, setRooms] = useState<HotelRoom[]>(INITIAL_ROOMS);
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<VisionAlert[]>(INITIAL_VISION_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [ticketBookings, setTicketBookings] = useState<TicketBooking[]>(INITIAL_BOOKINGS);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>(INITIAL_HOTEL_BOOKINGS);

  // IPTV Module State
  const [iptvSettings, setIptvSettings] = useState<IPTVGlobalSettings>(INITIAL_IPTV_SETTINGS);
  const [iptvContents, setIptvContents] = useState<IPTVContentItem[]>(INITIAL_IPTV_CONTENTS);
  const [iptvPlaylists, setIptvPlaylists] = useState<IPTVPlaylist[]>(INITIAL_IPTV_PLAYLISTS);
  const [iptvProviders, setIptvProviders] = useState<IPTVProvider[]>(INITIAL_IPTV_PROVIDERS);
  const [iptvNotifications, setIptvNotifications] = useState<IPTVNotification[]>(INITIAL_IPTV_NOTIFICATIONS);
  const [iptvWatchHistory, setIptvWatchHistory] = useState<IPTVWatchHistoryItem[]>(INITIAL_WATCH_HISTORY);
  const [iptvFavorites, setIptvFavorites] = useState<string[]>(['tv-rti1', 'vod-1', 'radio-trace']);

  // Active Tab for Voyageur, Super Admin, Agency Admin, and Hotel Admin
  const [activeTravelerTab, setActiveTravelerTab] = useState<'home' | 'transport' | 'hotels' | 'vision' | 'iptv' | 'design-system'>('home');
  const [activeSuperAdminTab, setActiveSuperAdminTab] = useState<'cards' | 'users' | 'kpis' | 'agencies' | 'hotels' | 'vision' | 'iptv' | 'audit' | 'ai' | 'architecture'>('cards');
  const [activeAgencyTab, setActiveAgencyTab] = useState<'cards' | 'overview' | 'fleet' | 'drivers' | 'schedules' | 'scanner' | 'analytics' | 'vision' | 'iptv'>('cards');
  const [activeHotelTab, setActiveHotelTab] = useState<'CARDS' | 'OVERVIEW' | 'HOTEL_PROFILE' | 'ROOMS' | 'BOOKINGS' | 'AUDIT'>('CARDS');
  
  // Universal Scroll to Top on any tab, role, or step change
  useScrollToTopOnNav([
    currentRole, 
    activeTravelerTab, 
    activeSuperAdminTab, 
    activeAgencyTab, 
    activeHotelTab, 
    activeBookingStep
  ]);
  
  // Session Auto-Restore on Mount (Non-Breaking, Persisted in LocalStorage)
  React.useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await authUseCases.getActiveSession();
        if (session && session.user) {
          setCurrentUser(session.user);
          setCurrentRole(session.user.role);
          if (session.user.agencyId) {
            setSelectedAgencyId(session.user.agencyId);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de la session:", err);
      }
    };
    restoreSession();
  }, [authUseCases]);

  // Modals state
  const [showTicketsWallet, setShowTicketsWallet] = useState<boolean>(false);
  const [showAIChat, setShowAIChat] = useState<boolean>(false);
  const [inspectingCamera, setInspectingCamera] = useState<Camera | null>(null);

  // Auth Success Handler & Quick Demo Switcher
  const handleLoginSuccess = (session: AuthSession, targetTab: string) => {
    setCurrentUser(session.user);
    setCurrentRole(session.user.role);
    if (session.user.agencyId) {
      setSelectedAgencyId(session.user.agencyId);
    }
    if (session.user.role === 'VOYAGEUR') {
      setActiveTravelerTab('transport');
    }
    setShowAuthModal(false);
  };

  // 🔐 SECURITY FIX: Removed insecure quick login. 
  // All users must now authenticate via the secure login portal.
  const handleQuickRoleLogin = async (email: string) => {
    console.warn("Security: Quick login with hardcoded password is disabled. Redirecting to portal.");
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await authUseCases.logout(currentUser.role, currentUser.email);
    }
    setCurrentUser(null);
    setCurrentRole('VOYAGEUR');
    setActiveTravelerTab('home');
  };


  // Handlers
  const handleBookTicket = (newBooking: TicketBooking) => {
    setTicketBookings(prev => [newBooking, ...prev]);

    // Record Audit Log with complete third-party traceability
    const isThirdParty = newBooking.isThirdPartyPurchase;
    const actionLabel = isThirdParty ? 'Achat Billet pour Tiers' : 'Réservation Billet Transport';
    const detailMsg = isThirdParty
      ? `Achat billet ${newBooking.ticketCode} par ${newBooking.buyerName} (${newBooking.buyerPhone || 'N/A'}) pour le bénéficiaire ${newBooking.passengerName} (${newBooking.passengerPhone}) - ${newBooking.departureCity} ➔ ${newBooking.arrivalCity} (Siège #${newBooking.seatNumber}) via ${newBooking.paymentMethod} - Attribution: ${newBooking.attributionStatus}`
      : `Achat billet ${newBooking.ticketCode} (${newBooking.departureCity} ➔ ${newBooking.arrivalCity}, Siège #${newBooking.seatNumber}) par ${newBooking.passengerName} via ${newBooking.paymentMethod}`;

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: newBooking.buyerName || newBooking.passengerName,
      role: 'VOYAGEUR',
      action: actionLabel,
      module: 'Transport',
      details: detailMsg,
      status: 'Succès',
      ipAddress: '41.202.12.80 (CI Mobile)'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleBookRoom = (newBooking: HotelBooking) => {
    setHotelBookings(prev => [newBooking, ...prev]);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: newBooking.guestName,
      role: 'VOYAGEUR',
      action: 'Réservation Chambre Hôtel',
      module: 'Hôtellerie',
      details: `Réservation ${newBooking.hotelName} (${newBooking.roomType}) - Montant ${(newBooking.totalPrice || 0).toLocaleString()} FCFA`,
      status: 'Succès',
      ipAddress: '41.207.18.99 (CI Mobile)'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleAddCamera = (newCamera: Camera) => {
    setCameras(prev => [newCamera, ...prev]);
  };

  const handleUpdateCamera = (updatedCam: Camera) => {
    setCameras(prev => prev.map(c => c.id === updatedCam.id ? updatedCam : c));
  };

  const handleDeleteCamera = (cameraId: string) => {
    setCameras(prev => prev.filter(c => c.id !== cameraId));
  };

  const handleResolveAlert = (alertId: string, status: 'Résolu' | 'Faux Positif') => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
  };

  const handleAddTrip = (newTrip: BusTrip) => {
    setTrips(prev => [newTrip, ...prev]);
  };

  const handleToggleTripPublication = (tripId: string) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const isCurrentlyPublished = !t.publicationStatus || t.publicationStatus === 'Publié';
        const nextStatus = isCurrentlyPublished ? 'Brouillon' : 'Publié';
        return { ...t, publicationStatus: nextStatus, isPublished: nextStatus === 'Publié' };
      }
      return t;
    }));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const handleAddDriver = (newDriver: Driver) => {
    setDrivers(prev => [newDriver, ...prev]);
  };

  const handleValidateTicket = (ticketCode: string): boolean => {
    let isValid = false;
    setTicketBookings(prev => prev.map(t => {
      if (t.ticketCode.toUpperCase() === ticketCode.toUpperCase()) {
        isValid = true;
        return { ...t, ticketStatus: 'Scanné / Utilisé' };
      }
      return t;
    }));
    return isValid;
  };

  const handleToggleAgencyStatus = (agencyId: string) => {
    setAgencies(prev => prev.map(a => {
      if (a.id === agencyId) {
        const nextStatus = a.status === 'Actif' ? 'Suspendu' : 'Actif';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleCreateAgency = async (params: CreateAgencyParams) => {
    const res = await transportUseCases.createAgencyTransaction({
      ...params,
      createdByRole: currentRole
    });

    setAgencies(prev => [res.agency, ...prev]);

    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user: params.adminEmail,
      role: currentRole,
      action: 'CRÉATION_AGENCE_TRANSPORT',
      module: 'Transport',
      details: `Création réussie de l'agence "${res.agency.name}" (${res.agency.code}) et association du compte admin ${res.adminUser.email}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '197.239.12.88 (CI-Abidjan)',
      status: 'Succès'
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);
  };

  // IPTV Handlers
  const handleToggleFavoriteIPTV = (contentId: string) => {
    setIptvFavorites(prev =>
      prev.includes(contentId) ? prev.filter(id => id !== contentId) : [...prev, contentId]
    );
  };

  const handleClearIPTVHistory = () => {
    setIptvWatchHistory([]);
  };

  const handleRemoveIPTVHistoryItem = (id: string) => {
    setIptvWatchHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleAddIPTVContent = (newContent: IPTVContentItem) => {
    setIptvContents(prev => [newContent, ...prev]);
  };

  const handleUpdateIPTVContent = (updatedContent: IPTVContentItem) => {
    setIptvContents(prev => prev.map(c => c.id === updatedContent.id ? updatedContent : c));
  };

  const handleDeleteIPTVContent = (id: string) => {
    setIptvContents(prev => prev.filter(c => c.id !== id));
  };

  const handleAddIPTVPlaylist = (newPl: IPTVPlaylist) => {
    setIptvPlaylists(prev => [newPl, ...prev]);
  };

  const handleSyncIPTVPlaylist = (id: string) => {
    setIptvPlaylists(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16) }
          : p
      )
    );
  };

  const handleAddIPTVNotification = (notif: IPTVNotification) => {
    setIptvNotifications(prev => [notif, ...prev]);
  };

  // ==================== HOTEL MANAGEMENT HANDLERS ====================
  const handleCreateHotel = async (params: CreateHotelParams) => {
    const res = await hotelUseCases.createHotelTransaction({
      ...params,
      createdByRole: currentRole
    });

    setHotels(prev => [res.hotel, ...prev]);
    setRooms(prev => [...res.rooms, ...prev]);

    const newAuditLog: AuditLog = {
      id: `audit-${Date.now()}`,
      user: params.adminEmail,
      role: currentRole,
      action: 'CRÉATION_ÉTABLISSEMENT_HÔTEL',
      module: 'Hôtellerie',
      details: `Création réussie de l'établissement "${res.hotel.name}" (${res.hotel.city}) et association du compte admin ${res.adminUser.email}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ipAddress: '197.239.12.88 (CI-Abidjan)',
      status: 'Succès'
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);
  };

  const handleUpdateHotel = (updatedHotel: Hotel) => {
    setHotels(prev => prev.map(h => h.id === updatedHotel.id ? updatedHotel : h));
  };

  const handleAddRoom = (newRoom: HotelRoom) => {
    setRooms(prev => [newRoom, ...prev]);
  };

  const handleUpdateRoom = (updatedRoom: HotelRoom) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  };

  const handleUpdateHotelBookingStatus = (bookingId: string, newStatus: 'Confirmé' | 'Check-in' | 'Check-out' | 'Annulé') => {
    setHotelBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId) || agencies[0];

  // Only trips belonging to an active authorized agency and published are visible to travelers
  const travelerVisibleTrips = useMemo(() => {
    const activeAgencyIds = new Set(agencies.filter(a => !a.status || a.status === 'Actif').map(a => a.id));
    return trips.filter(trip => {
      if (!activeAgencyIds.has(trip.agencyId)) return false;
      if (trip.publicationStatus && trip.publicationStatus !== 'Publié') return false;
      return true;
    });
  }, [trips, agencies]);

  // Only active and published hotels are visible to travelers
  const travelerVisibleHotels = useMemo(() => {
    return hotels.filter(h => !h.status || h.status === 'Actif');
  }, [hotels]);

  // Derive active tab ID for IvoirexpressShell navigation drawer highlight
  let currentShellTab = activeTravelerTab as string;
  if (currentRole === 'SUPER_ADMIN') {
    const superTabMap: Record<string, string> = {
      cards: 'super-dash',
      settings: 'super-settings',
      users: 'super-users',
      agencies: 'super-agencies',
      hotels: 'super-hotels',
      vision: 'super-vision',
      iptv: 'super-iptv',
      ai: 'super-ai',
      kpis: 'super-kpis',
      audit: 'super-logs',
      architecture: 'super-bdd'
    };
    currentShellTab = superTabMap[activeSuperAdminTab] || 'super-dash';
  } else if (currentRole === 'ADMIN_AGENCE') {
    const agencyTabMap: Record<string, string> = {
      cards: 'agency-dash',
      overview: 'agency-dash',
      schedules: 'agency-lines',
      fleet: 'agency-fleet',
      drivers: 'agency-drivers',
      scanner: 'agency-scanner',
      vision: 'agency-vision',
      iptv: 'agency-iptv',
      analytics: 'agency-audit'
    };
    currentShellTab = agencyTabMap[activeAgencyTab] || 'agency-dash';
  } else if (currentRole === 'ADMIN_HOTEL') {
    const hotelTabMap: Record<string, string> = {
      CARDS: 'hotel-dash',
      OVERVIEW: 'hotel-dash',
      HOTEL_PROFILE: 'hotel-profile',
      ROOMS: 'hotel-rooms',
      BOOKINGS: 'hotel-bookings',
      AUDIT: 'hotel-audit'
    };
    currentShellTab = hotelTabMap[activeHotelTab] || 'hotel-dash';
  }

  // Zero-Trust Security Gatekeeper: if no authenticated user, render SingleLoginPortal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <SingleLoginPortal
          isOpen={true}
          isStandalonePage={true}
          onLoginSuccess={handleLoginSuccess}
          currentActiveUser={null}
          initialMode={authModalInitialMode}
        />
      </div>
    );
  }

  return (
    <IvoirexpressShell
      currentRole={currentRole}
      currentUser={currentUser}
      activeTab={currentShellTab}
      bookingStep={activeBookingStep}
      onExitBooking={() => setActiveBookingStep(null)}
      onTabChange={(tab) => {
        if (currentRole === 'SUPER_ADMIN') {
          if (tab === 'super-dash' || tab === 'cards') setActiveSuperAdminTab('cards');
          else if (tab === 'super-settings' || tab === 'settings') setActiveSuperAdminTab('settings');
          else if (tab === 'super-users' || tab === 'users') setActiveSuperAdminTab('users');
          else if (tab === 'super-agencies' || tab === 'agencies') setActiveSuperAdminTab('agencies');
          else if (tab === 'super-hotels' || tab === 'hotels') setActiveSuperAdminTab('hotels');
          else if (tab === 'super-vision' || tab === 'vision') setActiveSuperAdminTab('vision');
          else if (tab === 'super-iptv' || tab === 'iptv') setActiveSuperAdminTab('iptv');
          else if (tab === 'super-ai' || tab === 'ai') setActiveSuperAdminTab('ai');
          else if (tab === 'super-kpis' || tab === 'kpis') setActiveSuperAdminTab('kpis');
          else if (tab === 'super-logs' || tab === 'audit') setActiveSuperAdminTab('audit');
          else if (tab === 'super-bdd' || tab === 'architecture' || tab === 'bdd') setActiveSuperAdminTab('architecture');
          else if (tab === 'design-system') {
            setCurrentRole('VOYAGEUR');
            setActiveTravelerTab('design-system');
          }
        } else if (currentRole === 'ADMIN_AGENCE') {
          if (tab === 'agency-dash' || tab === 'cards') setActiveAgencyTab('cards');
          else if (tab === 'agency-lines' || tab === 'schedules') setActiveAgencyTab('schedules');
          else if (tab === 'agency-fleet' || tab === 'fleet') setActiveAgencyTab('fleet');
          else if (tab === 'agency-drivers' || tab === 'drivers') setActiveAgencyTab('drivers');
          else if (tab === 'agency-scanner' || tab === 'scanner') setActiveAgencyTab('scanner');
          else if (tab === 'agency-vision' || tab === 'vision') setActiveAgencyTab('vision');
          else if (tab === 'agency-iptv' || tab === 'iptv') setActiveAgencyTab('iptv');
          else if (tab === 'agency-audit' || tab === 'analytics') setActiveAgencyTab('analytics');
          else if (tab === 'design-system') {
            setCurrentRole('VOYAGEUR');
            setActiveTravelerTab('design-system');
          }
        } else if (currentRole === 'ADMIN_HOTEL') {
          if (tab === 'hotel-dash' || tab === 'CARDS') setActiveHotelTab('CARDS');
          else if (tab === 'hotel-profile' || tab === 'HOTEL_PROFILE') setActiveHotelTab('HOTEL_PROFILE');
          else if (tab === 'hotel-rooms' || tab === 'ROOMS') setActiveHotelTab('ROOMS');
          else if (tab === 'hotel-bookings' || tab === 'BOOKINGS') setActiveHotelTab('BOOKINGS');
          else if (tab === 'hotel-audit' || tab === 'AUDIT') setActiveHotelTab('AUDIT');
          else if (tab === 'design-system') {
            setCurrentRole('VOYAGEUR');
            setActiveTravelerTab('design-system');
          }
        } else {
          if (['home', 'transport', 'hotels', 'vision', 'iptv', 'design-system'].includes(tab)) {
            if (tab !== 'transport') {
              setActiveBookingStep(null);
            }
            setActiveTravelerTab(tab as any);
          }
        }
      }}
      onRoleSwitch={async (role) => {
        setCurrentRole(role);
        setActiveBookingStep(null);
        if (!currentUser) {
          if (role === 'SUPER_ADMIN') {
            await handleQuickRoleLogin('fabriceallechi@gmail.com');
          } else if (role === 'ADMIN_AGENCE') {
            await handleQuickRoleLogin('gestionnaire@utb.ci');
          } else if (role === 'ADMIN_HOTEL') {
            await handleQuickRoleLogin('reception@hotel-ivoire.ci');
          }
        }
      }}
      onOpenAuthModal={() => {
        setAuthModalInitialMode('LOGIN');
        setShowAuthModal(true);
      }}
      onOpenRegister={() => {
        setAuthModalInitialMode('REGISTER');
        setShowAuthModal(true);
      }}
      onLogout={handleLogout}
      onOpenTicketsWallet={() => setShowTicketsWallet(true)}
    >
      {/* Role Specification Context Bar */}
      <RoleInfoBanner
        currentRole={currentRole}
        selectedAgencyName={selectedAgency?.name}
      />

      {/* Main Body Layout */}
      <div className="pb-12 w-full max-w-full min-w-0">
        
        {/* ==================== VOYAGEUR INTERFACE ==================== */}
        {currentRole === 'VOYAGEUR' && (
          <div>
            {/* Tab Views */}
            {activeTravelerTab === 'home' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3">
                <LandingPage
                  onOpenLogin={() => {
                    setAuthModalInitialMode('LOGIN');
                    setShowAuthModal(true);
                  }}
                  onOpenRegister={() => {
                    setAuthModalInitialMode('REGISTER');
                    setShowAuthModal(true);
                  }}
                  onExploreTab={(tab) => setActiveTravelerTab(tab)}
                  onQuickRoleLogin={handleQuickRoleLogin}
                  hotels={hotels}
                  trips={travelerVisibleTrips}
                />
              </div>
            )}

            {activeTravelerTab === 'transport' && (
              <TransportBooking
                trips={travelerVisibleTrips}
                onBookTicket={handleBookTicket}
                myBookings={ticketBookings}
                currentUser={currentUser}
                onBookingStepChange={(step) => setActiveBookingStep(step)}
                onOpenMyTickets={() => setShowTicketsWallet(true)}
              />
            )}

            {activeTravelerTab === 'hotels' && (
              <HotelBookingView
                hotels={travelerVisibleHotels}
                rooms={rooms}
                onBookRoom={handleBookRoom}
                onBack={() => setActiveTravelerTab('home')}
                onOpenMyTickets={() => setShowTicketsWallet(true)}
              />
            )}

            {activeTravelerTab === 'vision' && (
              <PersonalVision
                cameras={cameras}
                alerts={alerts}
                onAddCamera={handleAddCamera}
                onUpdateCamera={handleUpdateCamera}
                onDeleteCamera={handleDeleteCamera}
                onResolveAlert={handleResolveAlert}
                onAnalyzeCameraWithAI={(cam) => setInspectingCamera(cam)}
              />
            )}

            {activeTravelerTab === 'iptv' && (
              <TravelerIPTV
                contents={iptvContents}
                favorites={iptvFavorites}
                watchHistory={iptvWatchHistory}
                notifications={iptvNotifications}
                onToggleFavorite={handleToggleFavoriteIPTV}
                onClearHistory={handleClearIPTVHistory}
                onRemoveHistoryItem={handleRemoveIPTVHistoryItem}
              />
            )}

            {activeTravelerTab === 'design-system' && (
              <IvoirexpressDesignSystemShowcase />
            )}

          </div>
        )}

        {/* ==================== ADMIN AGENCE INTERFACE ==================== */}
        {currentRole === 'ADMIN_AGENCE' && (
          <ProtectedRoute
            currentUser={currentUser}
            allowedRoles={['ADMIN_AGENCE', 'SUPER_ADMIN']}
            workspaceName="Administration Agence de Transport"
            onOpenPortal={() => {
              setAuthModalInitialMode('LOGIN');
              setShowAuthModal(true);
            }}
          >
            <AgencyDashboard
              agency={selectedAgency}
              trips={trips}
              vehicles={vehicles}
              drivers={drivers}
              bookings={ticketBookings}
              cameras={cameras}
              alerts={alerts}
              iptvSettings={iptvSettings}
              activeTab={activeAgencyTab}
              onTabChange={setActiveAgencyTab}
              onAddTrip={handleAddTrip}
              onToggleTripPublication={handleToggleTripPublication}
              onAddVehicle={handleAddVehicle}
              onAddDriver={handleAddDriver}
              onValidateTicket={handleValidateTicket}
              onAddCamera={handleAddCamera}
            />
          </ProtectedRoute>
        )}

        {/* ==================== ADMIN HOTEL INTERFACE ==================== */}
        {currentRole === 'ADMIN_HOTEL' && (
          <ProtectedRoute
            currentUser={currentUser}
            allowedRoles={['ADMIN_HOTEL', 'SUPER_ADMIN']}
            workspaceName="Portail Gestionnaire Hôtelier"
            onOpenPortal={() => {
              setAuthModalInitialMode('LOGIN');
              setShowAuthModal(true);
            }}
          >
            <HotelAdminDashboard
              hotels={hotels}
              rooms={rooms}
              bookings={hotelBookings}
              currentUser={currentUser}
              activeTab={activeHotelTab}
              onTabChange={setActiveHotelTab}
              onUpdateHotel={handleUpdateHotel}
              onAddRoom={handleAddRoom}
              onUpdateRoom={handleUpdateRoom}
              onUpdateBookingStatus={handleUpdateHotelBookingStatus}
              onCreateHotel={handleCreateHotel}
            />
          </ProtectedRoute>
        )}

        {/* ==================== SUPER ADMIN INTERFACE ==================== */}
        {currentRole === 'SUPER_ADMIN' && (
          <ProtectedRoute
            currentUser={currentUser}
            allowedRoles={['SUPER_ADMIN']}
            workspaceName="Console Nationale Super Admin"
            onOpenPortal={() => {
              setAuthModalInitialMode('LOGIN');
              setShowAuthModal(true);
            }}
          >
            <SuperAdminDashboard
              agencies={agencies}
              hotels={hotels}
              cameras={cameras}
              alerts={alerts}
              auditLogs={auditLogs}
              ticketBookings={ticketBookings}
              hotelBookings={hotelBookings}
              iptvSettings={iptvSettings}
              iptvContents={iptvContents}
              iptvPlaylists={iptvPlaylists}
              iptvProviders={iptvProviders}
              iptvNotifications={iptvNotifications}
              activeTab={activeSuperAdminTab}
              onTabChange={setActiveSuperAdminTab}
              onUpdateIptvSettings={setIptvSettings}
              onAddIptvContent={handleAddIPTVContent}
              onUpdateIptvContent={handleUpdateIPTVContent}
              onDeleteIptvContent={handleDeleteIPTVContent}
              onAddIptvPlaylist={handleAddIPTVPlaylist}
              onSyncIptvPlaylist={handleSyncIPTVPlaylist}
              onAddIptvNotification={handleAddIPTVNotification}
              onToggleAgencyStatus={handleToggleAgencyStatus}
              onCreateAgency={handleCreateAgency}
              onCreateHotel={handleCreateHotel}
              onGenerateAIReport={() => {}}
            />
          </ProtectedRoute>
        )}

      </div>

      {/* Floating Global Modals & Utilities */}

      {/* Digital Ticket Wallet Modal */}
      {showTicketsWallet && (
        <MyTicketsModal
          ticketBookings={ticketBookings}
          hotelBookings={hotelBookings}
          currentUser={currentUser}
          onClose={() => setShowTicketsWallet(false)}
        />
      )}

      {/* Aya AI Assistant Floating Drawer */}
      <AICoreDrawer
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        userRole={currentRole}
      />

      {/* Vision AI Snapshot Analysis Modal */}
      {inspectingCamera && (
        <VisionAIModal
          camera={inspectingCamera}
          onClose={() => setInspectingCamera(null)}
        />
      )}

      {/* Portail de Connexion Unique IVOIReXpress */}
      <SingleLoginPortal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
        currentActiveUser={currentUser}
        initialMode={authModalInitialMode === 'REGISTER' ? 'REGISTER' : 'LOGIN'}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">IVOIReXpress Nouvelle Génération</span>
            <span>• République de Côte d'Ivoire</span>
          </div>
          <p>© 2026 IVOIReXpress. Design System & Platform Architecture v2.0.</p>
        </div>
      </footer>
    </IvoirexpressShell>
  );
}

export default function App() {
  return (
    <HexagonalProvider>
      <BannersProvider>
        <IPTVProviderComponent>
          <AppContent />
        </IPTVProviderComponent>
      </BannersProvider>
    </HexagonalProvider>
  );
}
