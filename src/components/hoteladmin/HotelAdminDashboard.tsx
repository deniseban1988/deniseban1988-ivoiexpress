import React, { useState, useMemo } from 'react';
import { Hotel, HotelRoom, HotelBooking, AccommodationType, UserAccount } from '../../types';
import { AddHotelModal } from './AddHotelModal';
import { CreateHotelParams } from '../../core/ports/hotel.ports';
import { 
  Building2, Bed, Calendar, Users, DollarSign, CheckCircle2, Clock, 
  Search, Plus, Edit2, Shield, QrCode, Filter, RefreshCw, X, Eye, 
  MapPin, Phone, Mail, Sparkles, Image, Check, AlertCircle, ArrowUpRight, LogIn, LogOut, FileText, Grid
} from 'lucide-react';
import { SmartServiceCard, ServiceCardTheme } from '../common/SmartServiceCard';
import { SynchronizedBannersBar } from '../common/SynchronizedBannersBar';
import { resetScrollToTop } from '../../lib/navigationScroll';
import { HOTEL_RECEPTIONIST_IMAGE } from '../../assets/welcomeAssets';

interface HotelAdminDashboardProps {
  hotels: Hotel[];
  rooms: HotelRoom[];
  bookings: HotelBooking[];
  currentUser?: UserAccount | null;
  onUpdateHotel: (updatedHotel: Hotel) => void;
  onAddRoom: (newRoom: HotelRoom) => void;
  onUpdateRoom: (updatedRoom: HotelRoom) => void;
  onUpdateBookingStatus: (bookingId: string, newStatus: 'Confirmé' | 'Check-in' | 'Check-out' | 'Annulé') => void;
  onCreateHotel?: (params: CreateHotelParams) => Promise<void> | void;
  activeTab?: 'CARDS' | 'OVERVIEW' | 'HOTEL_PROFILE' | 'ROOMS' | 'BOOKINGS' | 'AUDIT';
  onTabChange?: (tab: 'CARDS' | 'OVERVIEW' | 'HOTEL_PROFILE' | 'ROOMS' | 'BOOKINGS' | 'AUDIT') => void;
}

export const HotelAdminDashboard: React.FC<HotelAdminDashboardProps> = ({
  hotels,
  rooms,
  bookings,
  currentUser,
  onUpdateHotel,
  onAddRoom,
  onUpdateRoom,
  onUpdateBookingStatus,
  onCreateHotel,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange
}) => {
  // Tenant-isolation: scope hotel administrator strictly to their assigned hotel
  const userHotelId = (currentUser?.role === 'ADMIN_HOTEL' && currentUser.hotelId) ? currentUser.hotelId : null;
  const accessibleHotels = useMemo(() => {
    if (userHotelId) {
      const filtered = hotels.filter(h => h.id === userHotelId);
      return filtered.length > 0 ? filtered : hotels;
    }
    return hotels;
  }, [hotels, userHotelId]);

  // Selected active hotel
  const [selectedHotelId, setSelectedHotelId] = useState<string>(
    userHotelId || accessibleHotels[0]?.id || hotels[0]?.id || 'hotel-sofitel'
  );
  const currentHotel = accessibleHotels.find(h => h.id === selectedHotelId) || accessibleHotels[0] || hotels[0];

  const [localActiveTab, setLocalActiveTab] = useState<'CARDS' | 'OVERVIEW' | 'HOTEL_PROFILE' | 'ROOMS' | 'BOOKINGS' | 'AUDIT'>('CARDS');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = (tab: any) => {
    setLocalActiveTab(tab);
    resetScrollToTop();
    if (controlledOnTabChange) {
      controlledOnTabChange(tab);
    }
  };
  const [cardSearch, setCardSearch] = useState('');

  // Filter states
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState(false);
  const [isEditHotelModalOpen, setIsEditHotelModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [selectedBookingForVoucher, setSelectedBookingForVoucher] = useState<HotelBooking | null>(null);

  // Form states for Hotel Profile
  const [hotelFormData, setHotelFormData] = useState<Partial<Hotel>>({});
  
  // New Photo input
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // New Room Form State
  const [roomFormData, setRoomFormData] = useState<Partial<HotelRoom>>({
    type: 'Standard',
    maxCapacity: 2,
    bedCount: 1,
    bedType: '1 Lit Double',
    pricePerNight: 50000,
    isAvailable: true,
    features: ['Wi-Fi', 'Climatisation', 'Télévision']
  });

  // Filter data for selected hotel
  const hotelRooms = (rooms || []).filter(r => r && r.hotelId === currentHotel?.id);
  const hotelBookings = (bookings || []).filter(b => b && b.hotelId === currentHotel?.id);

  // Key metrics
  const totalRevenue = hotelBookings
    .filter(b => b && b.paymentStatus === 'Payé')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const occupiedRoomsCount = hotelRooms.filter(r => r && !r.isAvailable).length;
  const occupancyRate = hotelRooms.length > 0 ? Math.round((occupiedRoomsCount / hotelRooms.length) * 100) : 0;
  
  const todayCheckedInCount = hotelBookings.filter(b => b && b.status === 'Check-in').length;
  const pendingArrivalsCount = hotelBookings.filter(b => b && b.status === 'Confirmé').length;

  // Filtered Bookings
  const filteredBookings = hotelBookings.filter(b => {
    if (!b) return false;
    const matchesSearch = 
      (b.bookingCode || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.guestName || '').toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.guestPhone || '').includes(bookingSearch);
    const matchesStatus = bookingStatusFilter === 'ALL' || b.status === bookingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // 16 Smart Service Cards Configuration for Hotel Admin
  const hotelServiceCards = [
    {
      id: 'profile',
      title: 'Fiche Établissement',
      category: 'Identité & Contact',
      description: 'Gestion du nom, classement étoiles, adresse et informations de contact.',
      icon: Building2,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${currentHotel?.stars || 5}★ ${currentHotel?.type || 'Hôtel'}`,
      metricLabel: 'Catégorie Certifiée',
      statusBadge: { text: 'Public', type: 'success' as const },
      quickActionLabel: 'Modifier Fiche',
      onClick: () => setActiveTab('HOTEL_PROFILE'),
      onQuickAction: () => openEditHotelModal()
    },
    {
      id: 'rooms',
      title: 'Chambres & Catégories',
      category: 'Inventaire Hébergement',
      description: 'Gestion des chambres, suites royales, bungalows et tarifs par nuitée.',
      icon: Bed,
      theme: 'blue' as ServiceCardTheme,
      metricValue: `${hotelRooms.length} Chambres`,
      metricLabel: 'Inventaire Total',
      statusBadge: { text: 'Disponible', type: 'info' as const },
      quickActionLabel: 'Gérer Chambres',
      onClick: () => setActiveTab('ROOMS'),
      onQuickAction: () => setIsAddRoomModalOpen(true)
    },
    {
      id: 'occupancy',
      title: 'Disponibilités & Planning',
      category: 'Calendrier Occupation',
      description: 'Plannings d\'occupation temps réel, taux d\'occupation et chambres libres.',
      icon: Calendar,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: `${occupancyRate}% Occupé`,
      metricLabel: 'Taux Remplissage',
      statusBadge: { text: 'Direct Sync', type: 'info' as const },
      quickActionLabel: 'Planning'
    },
    {
      id: 'bookings',
      title: 'Réservations Réception',
      category: 'Gestion des Clients',
      description: 'Liste des réservations confirmées, en attente et vouchers de paiement.',
      icon: FileText,
      theme: 'indigo' as ServiceCardTheme,
      metricValue: `${hotelBookings.length} Résas`,
      metricLabel: 'Réservations Enregistrées',
      statusBadge: { text: 'Payé MoMo', type: 'success' as const },
      quickActionLabel: 'Voir Réservations',
      backgroundImage: HOTEL_RECEPTIONIST_IMAGE,
      onClick: () => setActiveTab('BOOKINGS')
    },
    {
      id: 'checkin',
      title: 'Check-in Arrivées',
      category: 'Réception & Clés',
      description: 'Enregistrement des arrivées du jour, remise des clés et badges.',
      icon: LogIn,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${pendingArrivalsCount} Arrivées`,
      metricLabel: 'Attente Check-in',
      statusBadge: { text: 'Prioritaire', type: 'success' as const },
      quickActionLabel: 'Valider Arrivées',
      backgroundImage: HOTEL_RECEPTIONIST_IMAGE,
      onClick: () => setActiveTab('BOOKINGS')
    },
    {
      id: 'checkout',
      title: 'Check-out Départs',
      category: 'Départs & Factures',
      description: 'Libération des chambres, règlement des extras et facturation finale.',
      icon: LogOut,
      theme: 'rose' as ServiceCardTheme,
      metricValue: `${todayCheckedInCount} En Chambre`,
      metricLabel: 'Départs à Venir',
      statusBadge: { text: 'En cours', type: 'danger' as const },
      quickActionLabel: 'Gérer Départs',
      onClick: () => setActiveTab('BOOKINGS')
    },
    {
      id: 'pricing',
      title: 'Tarifs & Saisonnalité',
      category: 'Grille Tarifaire FCFA',
      description: 'Ajustement des tarifs par nuitée, suppléments petit-déjeuner et taxes.',
      icon: DollarSign,
      theme: 'amber' as ServiceCardTheme,
      metricValue: `${(currentHotel?.pricePerNight || 45000).toLocaleString()} FCFA`,
      metricLabel: 'Tarif à partir de',
      statusBadge: { text: 'Saison Haute', type: 'warning' as const },
      quickActionLabel: 'Ajuster Tarifs'
    },
    {
      id: 'gallery',
      title: 'Galerie Photos & Médias',
      category: 'Vitrine Visuelle',
      description: 'Gestion des photos haute définition de l\'établissement, suites et piscine.',
      icon: Image,
      theme: 'purple' as ServiceCardTheme,
      metricValue: `${currentHotel?.gallery?.length || 4} Photos`,
      metricLabel: 'Visuels Galerie',
      statusBadge: { text: 'HD Media', type: 'info' as const },
      quickActionLabel: 'Ajouter Photo',
      onQuickAction: () => setIsAddPhotoModalOpen(true)
    },
    {
      id: 'amenities',
      title: 'Services & Équipements',
      category: 'Prestations de l\'Hôtel',
      description: 'Catalogue d\'équipements : Wi-Fi, Piscine, Spa, Restaurant, Navette aéroport.',
      icon: Sparkles,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${currentHotel?.amenities?.length || 8} Services`,
      metricLabel: 'Prestations Incluses',
      statusBadge: { text: 'Vérifié', type: 'success' as const },
      quickActionLabel: 'Équipements'
    },
    {
      id: 'promos',
      title: 'Promotions & Réductions',
      category: 'Marketing Hôtelier',
      description: 'Offres spéciales week-end, réductions long séjour et codes promo usagers.',
      icon: DollarSign,
      theme: 'orange' as ServiceCardTheme,
      metricValue: '-15% Long Séjour',
      metricLabel: 'Offres Actives',
      statusBadge: { text: 'En Cours', type: 'warning' as const },
      quickActionLabel: 'Créer Promo'
    },
    {
      id: 'guests',
      title: 'Clients & Guests VIP',
      category: 'Répertoire Réception',
      description: 'Fiches préférences usagers, historique des séjours et numéros de téléphone.',
      icon: Users,
      theme: 'slate' as ServiceCardTheme,
      metricValue: `${Array.from(new Set(hotelBookings.map(b => b.guestPhone))).length} Guests`,
      metricLabel: 'Clients Enregistrés',
      statusBadge: { text: 'Base Client', type: 'neutral' as const },
      quickActionLabel: 'Répertoire Guests'
    },
    {
      id: 'activity',
      title: 'Rapports d\'Activité',
      category: 'Bilan Financier',
      description: 'Revenus mensuels des chambres, commissions et bilan comptable.',
      icon: FileText,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${totalRevenue.toLocaleString()} FCFA`,
      metricLabel: 'Chiffre d\'Affaires',
      statusBadge: { text: 'Certifié', type: 'success' as const },
      quickActionLabel: 'Consulter Bilan',
      onClick: () => setActiveTab('OVERVIEW')
    },
    {
      id: 'payments',
      title: 'Paiements Hôteliers',
      category: 'Recettes Mobile Money',
      description: 'Encaissements instantanés Wave, Orange Money, MTN et cartes bancaires.',
      icon: DollarSign,
      theme: 'orange' as ServiceCardTheme,
      metricValue: '100% Mobile',
      metricLabel: 'Paiements Sécurisés',
      statusBadge: { text: 'Auto Sync', type: 'warning' as const },
      quickActionLabel: 'Détails Encaissements'
    },
    {
      id: 'stats',
      title: 'Statistiques & Occupancy',
      category: 'Analytics Hôteliers',
      description: 'Durée moyenne des séjours, taux de conversion et avis clients.',
      icon: Users,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: `${occupiedRoomsCount} / ${hotelRooms.length} Occupées`,
      metricLabel: 'Statut Chambres',
      statusBadge: { text: 'Performance', type: 'info' as const },
      quickActionLabel: 'Tableau KPIs',
      onClick: () => setActiveTab('OVERVIEW')
    },
    {
      id: 'notifs',
      title: 'Notifications Réception',
      category: 'Alertes Clientèle',
      description: 'Demandes particulières des clients, arrivées tardives et alertes.',
      icon: AlertCircle,
      theme: 'rose' as ServiceCardTheme,
      metricValue: 'Direct 24/7',
      metricLabel: 'Flux Réception',
      statusBadge: { text: 'Temps Réel', type: 'danger' as const },
      quickActionLabel: 'Consulter Alertes'
    },
    {
      id: 'settings',
      title: 'Paramètres Établissement',
      category: 'Politique & Réglages',
      description: 'Conditions d\'annulation, heures de réception (24h/24) et règlement.',
      icon: Building2,
      theme: 'slate' as ServiceCardTheme,
      metricValue: currentHotel?.receptionHours || '24h/24',
      metricLabel: 'Ouverture Réception',
      statusBadge: { text: 'Actif', type: 'neutral' as const },
      quickActionLabel: 'Réglages Établissement'
    }
  ];

  const filteredCards = hotelServiceCards.filter(c => 
    c.title.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const openEditHotelModal = () => {
    if (currentHotel) {
      setHotelFormData({ ...currentHotel });
      setIsEditHotelModalOpen(true);
    }
  };

  const handleSaveHotelProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentHotel && hotelFormData.name) {
      onUpdateHotel({
        ...currentHotel,
        ...hotelFormData
      } as Hotel);
      setIsEditHotelModalOpen(false);
    }
  };

  const handleAddPhotoToGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentHotel && newPhotoUrl.trim()) {
      const updatedGallery = [...(currentHotel.gallery || []), newPhotoUrl.trim()];
      onUpdateHotel({
        ...currentHotel,
        gallery: updatedGallery
      });
      setNewPhotoUrl('');
      setIsAddPhotoModalOpen(false);
    }
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHotel) return;

    if (editingRoom) {
      // Edit
      onUpdateRoom({
        ...editingRoom,
        ...roomFormData
      } as HotelRoom);
      setEditingRoom(null);
    } else {
      // Create
      const newRoomObj: HotelRoom = {
        id: `room-${currentHotel.id}-${Date.now().toString().slice(-4)}`,
        hotelId: currentHotel.id,
        roomNumber: roomFormData.roomNumber || `N-${Math.floor(Math.random() * 800 + 100)}`,
        name: roomFormData.name || `${roomFormData.type || 'Chambre'} Supérieure`,
        type: roomFormData.type as any || 'Standard',
        description: roomFormData.description || 'Chambre confortable équipée de tout le confort moderne.',
        pricePerNight: Number(roomFormData.pricePerNight) || 50000,
        maxCapacity: Number(roomFormData.maxCapacity) || 2,
        bedCount: Number(roomFormData.bedCount) || 1,
        bedType: roomFormData.bedType || '1 Lit Double King',
        isAvailable: roomFormData.isAvailable ?? true,
        features: roomFormData.features || ['Wi-Fi', 'Climatisation'],
        imageUrl: roomFormData.imageUrl || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&auto=format&fit=crop&q=80'
      };
      onAddRoom(newRoomObj);
    }
    setIsAddRoomModalOpen(false);
  };

  const ALL_AMENITIES = [
    'Wi-Fi 4G High Speed', 'Climatisation', 'Piscine Olympique', 'Spa & Massage',
    '3 Restaurants Gastronomiques', 'Palais des Congrès', 'Navette Aéroport VIP',
    'Parking Sécurisé Video-Surveillé', 'Accessibilité PMR', 'Golf 18 Trous',
    'Tennis', 'Service de Majordome', 'Petit Déjeuner Inclus', 'Jet-ski & Pédalo'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Header / Context Selector */}
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Espace Administration Hôtelière
                </span>
                <span className="text-xs text-slate-400">CI-HOTEL-TENANT</span>
              </div>
              <h1 className="text-2xl font-bold text-white flex items-center space-x-2 mt-0.5">
                <span>{currentHotel?.name || 'Sélectionner un Établissement'}</span>
                <span className="text-amber-400 text-sm font-semibold flex items-center">
                  {'★'.repeat(currentHotel?.stars || 3)}
                </span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>{currentHotel?.address}, {currentHotel?.commune}, {currentHotel?.city} ({currentHotel?.region})</span>
              </p>
            </div>
          </div>

          {/* Hotel Selector if multiple or badge if assigned */}
          <div className="flex items-center space-x-3">
            {accessibleHotels.length > 1 ? (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-1.5 flex items-center space-x-2">
                <span className="text-xs text-slate-400 pl-2">Établissement géré :</span>
                <select 
                  value={selectedHotelId}
                  onChange={(e) => setSelectedHotelId(e.target.value)}
                  className="bg-slate-900 text-white text-xs font-semibold rounded-md px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  {accessibleHotels.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{currentHotel?.name}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                  Hôtel Assigné
                </span>
              </div>
            )}

            <button
              onClick={openEditHotelModal}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition border border-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modifier la Fiche</span>
            </button>

            {onCreateHotel && (
              <button
                onClick={() => setIsAddHotelModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un Établissement</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Banners Bar (Cloud Firestore Sync) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <SynchronizedBannersBar targetModuleFilter="HOTELLERIE" />
      </div>

      {/* Main Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="flex border-b border-slate-800 overflow-x-auto space-x-2 sm:space-x-4 pb-px">
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'CARDS' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>⚡ Cartes de Services (16)</span>
          </button>

          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'OVERVIEW' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tableau de Bord & KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab('HOTEL_PROFILE')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'HOTEL_PROFILE' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Fiche & Galerie Multimédia</span>
          </button>

          <button
            onClick={() => setActiveTab('ROOMS')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'ROOMS' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Gestion des Chambres ({hotelRooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'BOOKINGS' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Réception & Check-in ({hotelBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center space-x-2 whitespace-nowrap transition ${
              activeTab === 'AUDIT' 
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500 border-x border-slate-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Registre de Conformité</span>
          </button>
        </div>

        {/* TAB 0: SMART SERVICE CARDS GRID */}
        {activeTab === 'CARDS' && (
          <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-emerald-400" />
                  <span>Centre des Cartes de Services Hôtelières ({currentHotel?.name})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Commandes administratives et centre de gestion des chambres, tarifs, réservations et hébergement.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un service hôtelier..."
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCards.map(card => (
                <SmartServiceCard key={card.id} {...card} />
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW & KPIS */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 ivx-card-dark-shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Chiffre d'Affaires Réalisé</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {totalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-400">FCFA</span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  Paiements sécurisés via Mobile Money
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 ivx-card-dark-shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Taux d'Occupation</span>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Bed className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {occupancyRate}%
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {occupiedRoomsCount} / {hotelRooms.length} chambres occupées
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 ivx-card-dark-shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Arrivées Prévues Aujourd'hui</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {pendingArrivalsCount}
                </div>
                <p className="text-[11px] text-amber-400 mt-1">
                  En attente de validation check-in
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 ivx-card-dark-shadow">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Clients Présents en Établissement</span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {todayCheckedInCount}
                </div>
                <p className="text-[11px] text-purple-400 mt-1">
                  Sejours actuellement actifs
                </p>
              </div>
            </div>

            {/* Quick Actions & Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Dernières Réservations & Arrivées</span>
                  </h2>
                  <button 
                    onClick={() => setActiveTab('BOOKINGS')}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Voir tout
                  </button>
                </div>

                {hotelBookings.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Aucune réservation enregistrée pour cet établissement.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hotelBookings.slice(0, 4).map(b => (
                      <div key={b.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs font-bold">
                            {b.bookingCode}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{b.guestName}</div>
                            <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span>{b.roomType}</span>
                              <span>•</span>
                              <span>Check-in: {b.checkInDate} ({b.nightsCount} nuit{b.nightsCount > 1 ? 's' : ''})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            b.status === 'Check-in' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            b.status === 'Confirmé' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            b.status === 'Check-out' ? 'bg-slate-800 text-slate-400' :
                            'bg-rose-500/10 text-rose-400'
                          }`}>
                            {b.status}
                          </span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {(b?.totalPrice || 0).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reception Quick Control Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>Contrôle Réception Rapide</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Scannez ou saisissez le code de réservation du voyageur à son arrivée.
                  </p>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('BOOKINGS')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Enregistrer un Check-in Client</span>
                    </button>

                    <button 
                      onClick={() => {
                        setEditingRoom(null);
                        setIsAddRoomModalOpen(true);
                      }}
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Ajouter une Nouvelle Chambre</span>
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Horaires Réception:</span>
                    <span className="text-white font-medium">{currentHotel?.receptionHours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact Direct:</span>
                    <span className="text-white font-medium">{currentHotel?.contactPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOTEL PROFILE & GALLERY */}
        {activeTab === 'HOTEL_PROFILE' && (
          <div className="space-y-6 mt-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <span>Fiche Nationale de l'Établissement</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Informations certifiées visibles par les voyageurs dans le module hôtelier IVOIReXpress.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={openEditHotelModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifier les Détails</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Photo Card */}
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 h-52 bg-slate-950">
                    <img 
                      src={currentHotel?.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} 
                      alt={currentHotel?.name || 'Hôtel'} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-amber-400 border border-slate-700">
                      {'★'.repeat(currentHotel?.stars || 3)} {currentHotel?.type}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 text-center">
                    Photo Principale / Façade de l'établissement
                  </div>
                </div>

                {/* Hotel Information Table */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Raison Sociale / Nom Commercial:</span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{currentHotel?.name}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Catégorie & Type:</span>
                      <span className="text-sm font-semibold text-emerald-400 mt-0.5 block">{currentHotel?.type} ({currentHotel?.stars} Étoiles)</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Localisation Administrative:</span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{currentHotel?.commune}, {currentHotel?.city} ({currentHotel?.region})</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Adresse & Quartier:</span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{currentHotel?.address}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Téléphone Réception:</span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{currentHotel?.contactPhone}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Email Professionnel:</span>
                      <span className="text-sm font-semibold text-white mt-0.5 block">{currentHotel?.email}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Horaires Accueil Réception:</span>
                      <span className="text-sm font-semibold text-amber-400 mt-0.5 block">{currentHotel?.receptionHours}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                      <span className="text-slate-500 block">Politique d'Annulation:</span>
                      <span className="text-sm font-semibold text-slate-300 mt-0.5 block">{currentHotel?.cancellationPolicy}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs">
                    <span className="text-slate-500 block mb-1">Description Officielle :</span>
                    <p className="text-slate-300 leading-relaxed">{currentHotel?.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Gallery Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Image className="w-4 h-4 text-emerald-400" />
                    <span>Galerie Photo Multimédia ({currentHotel?.gallery?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Photos haute définition présentées aux voyageurs (Lobby, Chambres, Restauration, Piscine).
                  </p>
                </div>
                <button
                  onClick={() => setIsAddPhotoModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ajouter une Photo</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentHotel?.gallery?.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-800 h-36 bg-slate-950">
                    <img src={imgUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'} alt={`Galerie ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <button
                      onClick={() => {
                        if (!currentHotel) return;
                        const updated = (currentHotel.gallery || []).filter((_, i) => i !== idx);
                        onUpdateHotel({ ...currentHotel, gallery: updated });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="Supprimer la photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities Checklist */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-3">Équipements & Services Certifiés</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ALL_AMENITIES.map((amenity) => {
                  const hasAmenity = currentHotel?.amenities?.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={() => {
                        if (!currentHotel) return;
                        const updatedAmenities = hasAmenity 
                          ? (currentHotel.amenities || []).filter(a => a !== amenity)
                          : [...(currentHotel.amenities || []), amenity];
                        onUpdateHotel({ ...currentHotel, amenities: updatedAmenities });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center space-x-2 transition ${
                        hasAmenity 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        hasAmenity ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-slate-700'
                      }`}>
                        {hasAmenity && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROOMS MANAGEMENT */}
        {activeTab === 'ROOMS' && (
          <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Bed className="w-5 h-5 text-emerald-400" />
                  <span>Gestion des Chambres & Hébergements</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Définissez la typologie, le nombre de lits, la capacité d'accueil et le prix par nuit en FCFA.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingRoom(null);
                  setRoomFormData({
                    type: 'Standard',
                    maxCapacity: 2,
                    bedCount: 1,
                    bedType: '1 Lit King Size',
                    pricePerNight: 50000,
                    isAvailable: true,
                    features: ['Wi-Fi', 'Climatisation']
                  });
                  setIsAddRoomModalOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une Nouvelle Chambre</span>
              </button>
            </div>

            {hotelRooms.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <Bed className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold">Aucune chambre répertoriée pour cet hôtel.</p>
                <p className="text-xs text-slate-500 mt-1">Cliquez sur le bouton ci-dessus pour ajouter des catégories de chambres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotelRooms.map(room => (
                  <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative h-44 bg-slate-950 overflow-hidden">
                        <img src={room.imageUrl || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80'} alt={room.name} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-mono font-bold text-white border border-slate-700">
                          Chambre #{room.roomNumber}
                        </div>
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          room.isAvailable 
                            ? 'bg-emerald-500/90 text-slate-950 border-emerald-400' 
                            : 'bg-rose-500/90 text-white border-rose-400'
                        }`}>
                          {room.isAvailable ? 'Disponible' : 'Occupée'}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">{room.type}</span>
                            <h3 className="text-base font-bold text-white">{room.name}</h3>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1">
                          <p> Capacité : <span className="text-white font-semibold">{room.maxCapacity} personnes max</span></p>
                          <p> Literie : <span className="text-white font-semibold">{room.bedType} ({room.bedCount} lit{room.bedCount > 1 ? 's' : ''})</span></p>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {room.features?.map((feat, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-slate-800/80 mt-3 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Tarif / Nuit</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                          {(room?.pricePerNight || 0).toLocaleString()} FCFA
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onUpdateRoom({ ...room, isAvailable: !room.isAvailable });
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            room.isAvailable 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {room.isAvailable ? 'Marquer Occupée' : 'Marquer Libre'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomFormData({ ...room });
                            setIsAddRoomModalOpen(true);
                          }}
                          className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                          title="Modifier la chambre"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RECEPTION & BOOKINGS */}
        {activeTab === 'BOOKINGS' && (
          <div className="space-y-6 mt-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    <span>Registre Général des Réservations & Check-in</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Gérez l'arrivée des clients, validez leur paiement Mobile Money et enregistrez leur départ.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="N° Réservation, Nom..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">Tous les Statuts</option>
                    <option value="Confirmé">Confirmé (En Attente)</option>
                    <option value="Check-in">Check-in (Présent)</option>
                    <option value="Check-out">Check-out (Terminé)</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Aucune réservation ne correspond à vos critères de recherche.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Code & Date</th>
                        <th className="py-3 px-4">Voyageur / Client</th>
                        <th className="py-3 px-4">Hébergement</th>
                        <th className="py-3 px-4">Séjour (Nuits)</th>
                        <th className="py-3 px-4">Montant & Paiement</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right">Actions Réception</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-850/50">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-emerald-400 block">{b.bookingCode}</span>
                            <span className="text-[10px] text-slate-500 block">{b.createdAt}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{b.guestName}</span>
                            <span className="text-[11px] text-slate-400 block">{b.guestPhone}</span>
                            {b.guestEmail && <span className="text-[10px] text-slate-500 block">{b.guestEmail}</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-white font-medium block">{b.roomType}</span>
                            <span className="text-[10px] text-slate-500 block">{b.guestsCount} personne(s)</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-amber-400 font-semibold block">{b.checkInDate} ➔ {b.checkOutDate}</span>
                            <span className="text-[10px] text-slate-400 block">{b.nightsCount} nuit(s)</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-emerald-400 block">{(b?.totalPrice || 0).toLocaleString()} FCFA</span>
                            <span className="text-[10px] text-slate-400 block">{b.paymentMethod} ({b.paymentStatus})</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                              b.status === 'Check-in' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              b.status === 'Confirmé' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              b.status === 'Check-out' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                              'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {b.status === 'Confirmé' && (
                              <button
                                onClick={() => onUpdateBookingStatus(b.id, 'Check-in')}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition"
                              >
                                Check-in
                              </button>
                            )}

                            {b.status === 'Check-in' && (
                              <button
                                onClick={() => onUpdateBookingStatus(b.id, 'Check-out')}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition"
                              >
                                Check-out
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedBookingForVoucher(b)}
                              className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                              title="Afficher le Reçu / Vouchers QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6 mt-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>Registre d'Audit Sécurisé & Conformité RBAC</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Journal des transactions et des opérations de la réception hôtelière certifié par la plateforme IVOIReXpress.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-mono font-semibold block">CHECKIN-SOFITEL-8812</span>
                    <span className="text-slate-300">Enregistrement Check-in de Kassi Marie-Laure</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">2026-08-02 08:30:12</span>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-mono font-semibold block">PAYMENT-MOBILE-MONEY</span>
                    <span className="text-slate-300">Encaissement 240 000 FCFA via Orange Money (Réf: OM-CI-REF-77120)</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">2026-08-01 22:30:00</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT HOTEL MODAL */}
      {isEditHotelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Modifier la Fiche d'Établissement</span>
              </h3>
              <button onClick={() => setIsEditHotelModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHotelProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Raison Sociale / Nom</label>
                  <input 
                    type="text" 
                    value={hotelFormData.name || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                    required 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Type d'Hébergement</label>
                  <select
                    value={hotelFormData.type || 'Hôtel'}
                    onChange={e => setHotelFormData({...hotelFormData, type: e.target.value as AccommodationType})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="Hôtel">Hôtel</option>
                    <option value="Résidence Meublée">Résidence Meublée</option>
                    <option value="Maison d'Hôtes">Maison d'Hôtes</option>
                    <option value="Appartement">Appartement</option>
                    <option value="Auberge">Auberge</option>
                    <option value="Complexe Touristique">Complexe Touristique</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Étoiles (0 à 5)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="5"
                    value={hotelFormData.stars ?? 3} 
                    onChange={e => setHotelFormData({...hotelFormData, stars: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Téléphone Réception</label>
                  <input 
                    type="text" 
                    value={hotelFormData.contactPhone || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, contactPhone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Région</label>
                  <input 
                    type="text" 
                    value={hotelFormData.region || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, region: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Ville</label>
                  <input 
                    type="text" 
                    value={hotelFormData.city || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, city: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Adresse Complète & Quartier</label>
                  <input 
                    type="text" 
                    value={hotelFormData.address || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, address: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">URL Photo Principale / Façade</label>
                  <input 
                    type="text" 
                    value={hotelFormData.imageUrl || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, imageUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Description Officielle</label>
                  <textarea 
                    rows={3}
                    value={hotelFormData.description || ''} 
                    onChange={e => setHotelFormData({...hotelFormData, description: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsEditHotelModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT ROOM MODAL */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Bed className="w-5 h-5 text-emerald-400" />
                <span>{editingRoom ? 'Modifier la Chambre' : 'Ajouter une Nouvelle Chambre'}</span>
              </h3>
              <button onClick={() => setIsAddRoomModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">N° ou Code Chambre</label>
                  <input 
                    type="text" 
                    placeholder="ex: 101, B-12"
                    value={roomFormData.roomNumber || ''} 
                    onChange={e => setRoomFormData({...roomFormData, roomNumber: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                    required 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Type de Chambre</label>
                  <select
                    value={roomFormData.type || 'Standard'}
                    onChange={e => setRoomFormData({...roomFormData, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe King">Deluxe King</option>
                    <option value="Suite Executive">Suite Executive</option>
                    <option value="Bungalow Vue Mer">Bungalow Vue Mer</option>
                    <option value="Appartement 2 Pièces">Appartement 2 Pièces</option>
                    <option value="Chambre Familiale">Chambre Familiale</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Nom Commercial de la Chambre</label>
                  <input 
                    type="text" 
                    placeholder="ex: Suite Royale Vue Lagune"
                    value={roomFormData.name || ''} 
                    onChange={e => setRoomFormData({...roomFormData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                    required 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Prix / Nuit (FCFA)</label>
                  <input 
                    type="number" 
                    value={roomFormData.pricePerNight || 50000} 
                    onChange={e => setRoomFormData({...roomFormData, pricePerNight: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold" 
                    required 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Capacité Max (Personnes)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={roomFormData.maxCapacity || 2} 
                    onChange={e => setRoomFormData({...roomFormData, maxCapacity: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Type & Configuration Literie</label>
                  <input 
                    type="text" 
                    placeholder="ex: 1 Lit King Size + 1 Lit Simple"
                    value={roomFormData.bedType || ''} 
                    onChange={e => setRoomFormData({...roomFormData, bedType: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">URL Photo de la Chambre</label>
                  <input 
                    type="text" 
                    value={roomFormData.imageUrl || ''} 
                    onChange={e => setRoomFormData({...roomFormData, imageUrl: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Enregistrer la Chambre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PHOTO TO GALLERY MODAL */}
      {isAddPhotoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Image className="w-5 h-5 text-emerald-400" />
                <span>Ajouter une Photo à la Galerie</span>
              </h3>
              <button onClick={() => setIsAddPhotoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhotoToGallery} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">URL de l'Image (HD)</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddPhotoModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                >
                  Ajouter à la Galerie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER / RECEIPT MODAL */}
      {selectedBookingForVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Voucher de Réservation Hôtelière</span>
              </h3>
              <button onClick={() => setSelectedBookingForVoucher(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Code VOUCHER :</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{selectedBookingForVoucher.bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Client / Voyageur :</span>
                <span className="text-white font-semibold">{selectedBookingForVoucher.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone :</span>
                <span className="text-white font-mono">{selectedBookingForVoucher.guestPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Établissement :</span>
                <span className="text-white font-semibold">{selectedBookingForVoucher.hotelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type de Chambre :</span>
                <span className="text-white">{selectedBookingForVoucher.roomType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dates de Séjour :</span>
                <span className="text-amber-400 font-semibold">{selectedBookingForVoucher.checkInDate} au {selectedBookingForVoucher.checkOutDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Montant Total :</span>
                <span className="text-emerald-400 font-mono font-bold text-base">{(selectedBookingForVoucher.totalPrice || 0).toLocaleString()} FCFA</span>
              </div>

              {/* QR Code Graphic Representation */}
              <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-2 mt-3">
                <QrCode className="w-24 h-24 text-slate-950" />
                <span className="text-[10px] text-slate-600 font-mono font-bold tracking-widest uppercase">
                  {selectedBookingForVoucher.digitalSignature}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedBookingForVoucher(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Hotel Modal */}
      {onCreateHotel && (
        <AddHotelModal
          isOpen={isAddHotelModalOpen}
          onClose={() => setIsAddHotelModalOpen(false)}
          onSubmit={async (params) => {
            await onCreateHotel(params);
            setIsAddHotelModalOpen(false);
          }}
          currentRole="ADMIN_HOTEL"
        />
      )}
    </div>
  );
};
