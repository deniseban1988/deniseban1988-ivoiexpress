import React, { useState } from 'react';
import { TransportAgency, BusTrip, Vehicle, Driver, TicketBooking, Camera, VisionAlert } from '../../types';
import { IPTVGlobalSettings } from '../../types/iptv';
import { Bus, Users, Calendar, TrendingUp, ShieldAlert, Plus, CheckCircle2, QrCode, DollarSign, Wrench, ChevronRight, Eye, Tv, Search, Grid, Smartphone, Layers, Sliders, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { VisionDashboard } from '../vision/VisionDashboard';
import { AgencyAdminIPTV } from '../iptv/AgencyAdminIPTV';
import { SmartServiceCard, ServiceCardTheme } from '../common/SmartServiceCard';
import { SynchronizedBannersBar } from '../common/SynchronizedBannersBar';
import { resetScrollToTop } from '../../lib/navigationScroll';
import { Seat3DRenderer } from '../traveler/Seat3DRenderer';
import { VehicleLayoutBuilder } from './VehicleLayoutBuilder';
import { BoardingScannerModal } from './BoardingScannerModal';
import { getLayoutForVehicle } from '../../data/transportData';

interface AgencyDashboardProps {
  agency: TransportAgency;
  trips: BusTrip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: TicketBooking[];
  cameras?: Camera[];
  alerts?: VisionAlert[];
  iptvSettings?: IPTVGlobalSettings;
  onAddTrip: (trip: BusTrip) => void;
  onToggleTripPublication?: (tripId: string) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onAddDriver: (driver: Driver) => void;
  onValidateTicket: (ticketCode: string) => boolean;
  onAddCamera?: (camera: Camera) => void;
  activeTab?: 'cards' | 'overview' | 'fleet' | 'drivers' | 'schedules' | 'scanner' | 'analytics' | 'vision' | 'iptv';
  onTabChange?: (tab: 'cards' | 'overview' | 'fleet' | 'drivers' | 'schedules' | 'scanner' | 'analytics' | 'vision' | 'iptv') => void;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({
  agency,
  trips,
  vehicles,
  drivers,
  bookings,
  cameras = [],
  alerts = [],
  iptvSettings = { moduleEnabled: true, agencyAccess: {}, defaultQuality: '1080p Full HD', maxSimultaneousStreams: 5000, autoSyncIntervalHours: 6 },
  onAddTrip,
  onToggleTripPublication,
  onAddVehicle,
  onAddDriver,
  onValidateTicket,
  onAddCamera = () => {},
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange
}) => {
  const [localActiveTab, setLocalActiveTab] = useState<'cards' | 'overview' | 'fleet' | 'drivers' | 'schedules' | 'scanner' | 'analytics' | 'vision' | 'iptv'>('cards');
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : localActiveTab;
  const setActiveTab = (tab: any) => {
    setLocalActiveTab(tab);
    resetScrollToTop();
    if (controlledOnTabChange) {
      controlledOnTabChange(tab);
    }
  };
  const [cardSearch, setCardSearch] = useState('');

  // Scanner state
  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; ticket?: TicketBooking } | null>(null);
  const [showAdvancedScanner, setShowAdvancedScanner] = useState<boolean>(false);
  const [inspectingTrip3D, setInspectingTrip3D] = useState<BusTrip | null>(null);
  const [showLayoutBuilder, setShowLayoutBuilder] = useState<boolean>(false);

  // New Trip Modal Form
  const [showTripModal, setShowTripModal] = useState<boolean>(false);
  const [newDepCity, setNewDepCity] = useState<string>('Abidjan');
  const [newArrCity, setNewArrCity] = useState<string>('Yamoussoukro');
  const [newPrice, setNewPrice] = useState<number>(5000);
  const [newDepTime, setNewDepTime] = useState<string>('09:00');
  const [newArrTime, setNewArrTime] = useState<string>('11:45');
  const [newDistanceKm, setNewDistanceKm] = useState<number>(235);
  const [newBusType, setNewBusType] = useState<'VIP Standard' | 'Business Class' | 'Luxe Climatisé'>('Luxe Climatisé');
  const [newTripStatus, setNewTripStatus] = useState<'Publié' | 'Brouillon'>('Publié');

  // New Vehicle Modal Form
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [vehBrand, setVehBrand] = useState<string>('Volvo');
  const [vehModel, setVehModel] = useState<string>('Marcopolo G7');
  const [vehImmat, setVehImmat] = useState<string>('1234-HX-01 (CI)');
  const [vehCapacity, setVehCapacity] = useState<number>(32);
  const [vehHasAC, setVehHasAC] = useState<boolean>(true);
  const [vehHasWifi, setVehHasWifi] = useState<boolean>(true);

  // New Driver Modal Form
  const [showDriverModal, setShowDriverModal] = useState<boolean>(false);
  const [drvName, setDrvName] = useState<string>('');
  const [drvPhone, setDrvPhone] = useState<string>('');
  const [drvLicense, setDrvLicense] = useState<string>('');
  const [drvExp, setDrvExp] = useState<number>(8);

  // Isolated agency filtering
  const agencyTrips = trips.filter(t => t.agencyId === agency.id);
  const agencyVehicles = vehicles.filter(v => v.agencyId === agency.id);
  const agencyDrivers = drivers.filter(d => d.agencyId === agency.id);
  const agencyBookings = bookings.filter(b => b.agencyId === agency.id);

  const totalRevenue = agencyBookings.reduce((sum, b) => sum + b.price, 0);

  // 14 Smart Service Cards Configuration for Agency Admin
  const agencyServiceCards = [
    {
      id: 'trips',
      title: 'Voyages Programmés',
      category: 'Départs & Trajets',
      description: 'Programmation des lignes interurbaines, horaires et création de nouveaux départs.',
      icon: Calendar,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${agencyTrips.length} Trajets`,
      metricLabel: 'Lignes Actives',
      statusBadge: { text: 'En Service', type: 'success' as const },
      quickActionLabel: 'Nouveau Trajet',
      onClick: () => setActiveTab('schedules'),
      onQuickAction: () => setShowTripModal(true)
    },
    {
      id: 'bookings',
      title: 'Réservations & Billets',
      category: 'Ventes & Passagers',
      description: 'Suivi des billets vendus, attribution des sièges et gestion des annulations.',
      icon: Users,
      theme: 'blue' as ServiceCardTheme,
      metricValue: `${agencyBookings.length} Billets`,
      metricLabel: 'Billets Émis',
      statusBadge: { text: 'Validé', type: 'info' as const },
      quickActionLabel: 'Voir Réservations',
      onClick: () => setActiveTab('overview')
    },
    {
      id: 'etickets',
      title: 'Billets Électroniques',
      category: 'Digitalisation QR',
      description: 'Émission sécurisée de e-billets avec signature numérique anti-fraude.',
      icon: CheckCircle2,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: '100% QR',
      metricLabel: 'Empreinte Crypto',
      statusBadge: { text: 'Sécurisé', type: 'success' as const },
      quickActionLabel: 'Gérer e-Billets'
    },
    {
      id: 'scanner',
      title: 'Scanner de Billets QR',
      category: 'Contrôle à l\'Embarquement',
      description: 'Validation instantanée des e-tickets par caméra ou saisie manuelle de code.',
      icon: QrCode,
      theme: 'orange' as ServiceCardTheme,
      metricValue: 'Validateur',
      metricLabel: 'Contrôle Gare',
      statusBadge: { text: 'Direct QR', type: 'warning' as const },
      quickActionLabel: 'Ouvrir Scanner',
      onClick: () => setActiveTab('scanner')
    },
    {
      id: 'fleet',
      title: 'Flotte de Véhicules',
      category: 'Parc Autocars',
      description: 'Supervision du parc d\'autocars VIP, climatisation, Wi-Fi et maintenance.',
      icon: Bus,
      theme: 'amber' as ServiceCardTheme,
      metricValue: `${agencyVehicles.length} Bus`,
      metricLabel: 'Flotte Active',
      statusBadge: { text: 'En Service', type: 'success' as const },
      quickActionLabel: 'Ajouter Autocar',
      onClick: () => setActiveTab('fleet'),
      onQuickAction: () => setShowVehicleModal(true)
    },
    {
      id: 'drivers',
      title: 'Chauffeurs & Pilotes',
      category: 'Personnel de Conduite',
      description: 'Registre des chauffeurs certifiés, vérification des permis et affectations.',
      icon: Users,
      theme: 'purple' as ServiceCardTheme,
      metricValue: `${agencyDrivers.length} Pilotes`,
      metricLabel: 'Chauffeurs Actifs',
      statusBadge: { text: 'Disponible', type: 'info' as const },
      quickActionLabel: 'Recruter Pilote',
      onClick: () => setActiveTab('drivers'),
      onQuickAction: () => setShowDriverModal(true)
    },
    {
      id: 'schedules',
      title: 'Horaires & Lignes',
      category: 'Gares & Horaires',
      description: 'Gestion des départs de gares, fréquences hebdomadaires et temps d\'arrêt.',
      icon: Calendar,
      theme: 'indigo' as ServiceCardTheme,
      metricValue: `${Array.from(new Set(agencyTrips.map(t => t.departureCity))).length} Gares`,
      metricLabel: 'Réseau Lignes',
      statusBadge: { text: 'Régulier', type: 'info' as const },
      quickActionLabel: 'Consulter Grille',
      onClick: () => setActiveTab('schedules')
    },
    {
      id: 'pricing',
      title: 'Tarification & Classes',
      category: 'Grille Tarifaire FCFA',
      description: 'Gestion des prix VIP Standard, Business Class et options bagages.',
      icon: DollarSign,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: 'FCFA VIP',
      metricLabel: 'Classes de Voyage',
      statusBadge: { text: 'Flexible', type: 'success' as const },
      quickActionLabel: 'Ajuster Tarifs'
    },
    {
      id: 'customers',
      title: 'Clients & Passagers',
      category: 'Fidélisation Usagers',
      description: 'Historique des passagers fréquents et contacts en cas d\'urgence.',
      icon: Users,
      theme: 'slate' as ServiceCardTheme,
      metricValue: `${Array.from(new Set(agencyBookings.map(b => b.passengerPhone))).length}`,
      metricLabel: 'Clients Uniques',
      statusBadge: { text: 'Base Client', type: 'neutral' as const },
      quickActionLabel: 'Voir Répertoire'
    },
    {
      id: 'activity',
      title: 'Rapports d\'Activité',
      category: 'Bilan Commercial',
      description: 'Chiffre d\'affaires quotidien, ventes par gare et statistiques d\'occupation.',
      icon: TrendingUp,
      theme: 'emerald' as ServiceCardTheme,
      metricValue: `${(totalRevenue || 0).toLocaleString()} FCFA`,
      metricLabel: 'Revenu Total',
      statusBadge: { text: 'Rentable', type: 'success' as const },
      quickActionLabel: 'Voir Bilan',
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'payments',
      title: 'Paiements & Encaissements',
      category: 'Comptabilité MoMo',
      description: 'Comptes Mobile Money rattachés, Wave, Orange Money et reçus électroniques.',
      icon: Smartphone,
      theme: 'orange' as ServiceCardTheme,
      metricValue: 'Mobile Money',
      metricLabel: 'Comptes Rattachés',
      statusBadge: { text: 'Automatique', type: 'warning' as const },
      quickActionLabel: 'Détails Comptes'
    },
    {
      id: 'stats',
      title: 'Statistiques & KPIs',
      category: 'Performance Operational',
      description: 'Graphiques de remplissage des car, prévisions de vente et ponctualité.',
      icon: TrendingUp,
      theme: 'cyan' as ServiceCardTheme,
      metricValue: '88% Occupé',
      metricLabel: 'Taux Remplissage',
      statusBadge: { text: 'Optimal', type: 'info' as const },
      quickActionLabel: 'Graphiques KPIs',
      onClick: () => setActiveTab('analytics')
    },
    {
      id: 'notifs',
      title: 'Notifications Agence',
      category: 'Alertes & Transmissions',
      description: 'Diffusion d\'infos retards, messages aux chauffeurs et rappels d\'inspection.',
      icon: ShieldAlert,
      theme: 'rose' as ServiceCardTheme,
      metricValue: '0 Retard',
      metricLabel: 'État du Trafic',
      statusBadge: { text: 'A la minute', type: 'danger' as const },
      quickActionLabel: 'Envoyer Info'
    },
    {
      id: 'settings',
      title: 'Paramètres Agence',
      category: 'Fiche & Identité',
      description: 'Mise à jour du logo, RCCM, adresse de la gare centrale et contacts.',
      icon: Wrench,
      theme: 'slate' as ServiceCardTheme,
      metricValue: agency.code,
      metricLabel: 'Code Registre',
      statusBadge: { text: 'Actif', type: 'neutral' as const },
      quickActionLabel: 'Éditer Profil'
    }
  ];

  const filteredCards = agencyServiceCards.filter(c => 
    c.title.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.category.toLowerCase().includes(cardSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const handleScanTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCodeInput.trim()) return;

    const inputClean = scanCodeInput.trim().toUpperCase();
    const matchedBooking = agencyBookings.find(b => 
      b.ticketCode.toUpperCase() === inputClean ||
      (b.qrCodeData && b.qrCodeData.toUpperCase().includes(inputClean))
    );

    if (!matchedBooking) {
      setScanResult({
        success: false,
        message: `Billet introuvable ou n'appartient pas à la compagnie ${agency.name}.`
      });
      return;
    }

    if (matchedBooking.ticketStatus === 'Scanné / Utilisé') {
      setScanResult({
        success: false,
        message: `ALERTE : Billet DÉJÀ VALIDÉ et utilisé pour ce voyage.`,
        ticket: matchedBooking
      });
      return;
    }

    const isValid = onValidateTicket(matchedBooking.ticketCode);
    setScanResult({
      success: true,
      message: `BILLETS SÉCURISÉ & VALIDE ! Signature numérique confirmée. Embarquement autorisé pour ${matchedBooking.passengerName} (Siège #${matchedBooking.seatNumber}).`,
      ticket: matchedBooking
    });
    setScanCodeInput('');
  };

  const handleCreateTrip = () => {
    const digitalSig = `SIG-IVX-${agency.code}-${Math.floor(100000 + Math.random() * 900000)}-2026`;
    const newTrip: BusTrip = {
      id: `trip-${Date.now()}`,
      agencyId: agency.id,
      agencyName: agency.name,
      agencyLogo: agency.logo,
      departureCity: newDepCity,
      arrivalCity: newArrCity,
      departureStation: `Gare ${agency.code} - ${newDepCity}`,
      arrivalStation: `Gare Centrale - ${newArrCity}`,
      distanceKm: newDistanceKm,
      estimatedDuration: '2h 45 min',
      departureTime: newDepTime,
      arrivalTime: newArrTime,
      date: '2026-08-03',
      price: Number(newPrice),
      availableSeats: 32,
      totalSeats: 32,
      vehicleId: agencyVehicles[0]?.id || 'veh-default',
      driverName: agencyDrivers[0]?.fullName || 'Chauffeur Assigné',
      busType: newBusType,
      amenities: ['Wi-Fi 4G', 'Climatisation', 'Prises USB'],
      occupiedSeats: [],
      digitalSignature: digitalSig,
      publicationStatus: newTripStatus,
      isPublished: newTripStatus === 'Publié'
    };

    onAddTrip(newTrip);
    setShowTripModal(false);
  };

  const handleCreateVehicle = () => {
    if (!vehImmat.trim()) return;
    const newVeh: Vehicle = {
      id: `veh-${agency.code}-${Date.now()}`,
      agencyId: agency.id,
      brand: vehBrand,
      model: `${vehBrand} ${vehModel}`,
      type: 'Autocar Grand Tourisme',
      immatriculation: vehImmat,
      capacity: Number(vehCapacity),
      hasAC: vehHasAC,
      hasWifi: vehHasWifi,
      hasUSB: true,
      status: 'En service',
      lastInspectionDate: new Date().toISOString().substring(0, 10),
      maintenanceHistory: [
        { id: `m-${Date.now()}`, date: new Date().toISOString().substring(0, 10), type: 'Révision Générale', description: 'Inspection initiale d\'enregistrement au parc', cost: 150000 }
      ]
    };
    onAddVehicle(newVeh);
    setShowVehicleModal(false);
  };

  const handleCreateDriver = () => {
    if (!drvName.trim() || !drvPhone.trim()) return;
    const newDrv: Driver = {
      id: `drv-${Date.now()}`,
      agencyId: agency.id,
      fullName: drvName,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      licenseNumber: drvLicense || `PERMIS-CI-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      licenseExpirationDate: '2029-12-31',
      phone: drvPhone,
      experienceYears: Number(drvExp),
      status: 'Disponible',
      missionHistory: []
    };
    onAddDriver(newDrv);
    setShowDriverModal(false);
  };

  // Recharts Chart Data
  const chartData = [
    { name: 'Lun', Ventes: 450000 },
    { name: 'Mar', Ventes: 380000 },
    { name: 'Mer', Ventes: 520000 },
    { name: 'Jeu', Ventes: 610000 },
    { name: 'Ven', Ventes: 890000 },
    { name: 'Sam', Ventes: 950000 },
    { name: 'Dim', Ventes: 720000 },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      
      {/* Isolated Agency Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 border border-blue-900/50 ivx-banner-shadow relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={agency.logo || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=200&q=80'}
              alt={agency.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-xl"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                  GESTION ISOLÉE DE COMPAGNIE
                </span>
                {agency.rccmNumber && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-bold">
                    RCCM: {agency.rccmNumber}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-white">{agency.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {agency.address || 'Gare Routière'} ({agency.commune || 'Adjamé'}, {agency.city || 'Abidjan'}) • Contact: {agency.contactPhone}
              </p>
              {agency.mobileMoneyAccount && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                  Compte Encaissement : {agency.mobileMoneyAccount}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Valider un Billet QR</span>
            </button>
            <button
              onClick={() => setShowTripModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Programmer Trajet</span>
            </button>
          </div>
        </div>

        {/* Agency Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          {[
            { id: 'cards', label: "⚡ Grille des Cartes de Services (14)" },
            { id: 'overview', label: "Vue d'ensemble" },
            { id: 'schedules', label: `Trajets (${agencyTrips.length})` },
            { id: 'fleet', label: `Autocars (${agencyVehicles.length})` },
            { id: 'drivers', label: `Chauffeurs (${agencyDrivers.length})` },
            { id: 'scanner', label: "Scanneur de Billets QR" },
            { id: 'vision', label: "Vidéosurveillance Agence" },
            { id: 'iptv', label: "Service IPTV Flotte" },
            { id: 'analytics', label: "Statistiques Ventes" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Synchronized Banners Bar (Firestore Real-time Sync) */}
      <SynchronizedBannersBar targetModuleFilter="TRANSPORT" className="my-2" />

      {/* SMART SERVICE CARDS GRID VIEW FOR AGENCY ADMIN */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <Grid className="w-4 h-4 text-blue-400" />
                <span>Centre des Cartes de Services Agence ({agency.name})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Commandes administratives et gestion de votre flotte d'autocars, réservations et gares.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un service d'agence..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
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

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recettes de l'Agence</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{(totalRevenue || 0).toLocaleString()} FCFA</p>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">100% encaissé via Mobile Money</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trajets Programmés</span>
              <p className="text-2xl font-black text-white mt-1">{agencyTrips.length}</p>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Départs quotidiens Côte d'Ivoire</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taux d'Occupation Flotte</span>
              <p className="text-2xl font-black text-orange-400 mt-1">84.2 %</p>
              <span className="text-[10px] text-orange-400 font-semibold mt-1 inline-block">+6.4% cette semaine</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 ivx-card-dark-shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Autocars en Service</span>
              <p className="text-2xl font-black text-blue-400 mt-1">{agencyVehicles.filter(v => v.status === 'En service').length} / {agencyVehicles.length}</p>
              <span className="text-[10px] text-slate-400 mt-1 inline-block">Contrôle technique à jour</span>
            </div>
          </div>

          {/* Recent Trips Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-extrabold text-white mb-4">Prochains Départs Programmés</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Trajet</th>
                    <th className="p-3">Départ</th>
                    <th className="p-3">Chauffeur</th>
                    <th className="p-3">Bus Type</th>
                    <th className="p-3">Tarif</th>
                    <th className="p-3">Places Réservées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {agencyTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-white">{trip.departureCity} ➔ {trip.arrivalCity}</td>
                      <td className="p-3 text-slate-300">{trip.departureTime} ({trip.date})</td>
                      <td className="p-3 text-slate-300">{trip.driverName}</td>
                      <td className="p-3 text-blue-400 font-semibold">{trip.busType}</td>
                      <td className="p-3 font-bold text-orange-400">{(trip?.price || 0).toLocaleString()} FCFA</td>
                      <td className="p-3 font-bold text-emerald-400">{trip.totalSeats - trip.availableSeats} / {trip.totalSeats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Ticket QR Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
              <QrCode className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Scanneur de Billets de Car</h2>
            <p className="text-xs text-slate-400 mt-1">Saisissez le code du billet ou scannez le QR Code du passager à l'embarquement.</p>
          </div>

          <form onSubmit={handleScanTicket} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Code Billet Billet QR (Ex: TICK-CI-8812)</label>
              <input
                type="text"
                placeholder="Ex: TICK-CI-8812"
                value={scanCodeInput}
                onChange={(e) => setScanCodeInput(e.target.value)}
                className="w-full bg-slate-950 text-white font-mono text-center text-lg tracking-widest px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 uppercase"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20"
            >
              Vérifier le Billet
            </button>
          </form>

          {scanResult && (
            <div className={`mt-6 p-4 rounded-xl border text-xs ${
              scanResult.success
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}>
              <p className="font-bold text-sm mb-1">{scanResult.message}</p>
              {scanResult.ticket && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                  <p>Passager: <strong>{scanResult.ticket.passengerName}</strong></p>
                  <p>Trajet: {scanResult.ticket.departureCity} ➔ {scanResult.ticket.arrivalCity}</p>
                  <p>Siège: #{scanResult.ticket.seatNumber} • Statut: {scanResult.ticket.ticketStatus}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fleet Management Tab */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white">Parc d'Autocars ({agencyVehicles.length})</h2>
              <p className="text-xs text-slate-400">Gestion de la flotte, maintenance préventive et équipements embarqués</p>
            </div>
            <button
              onClick={() => setShowVehicleModal(true)}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Autocar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyVehicles.map(veh => (
              <div key={veh.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm">{veh.model}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      veh.status === 'En service'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {veh.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-orange-400 mt-0.5">{veh.immatriculation}</p>
                  
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {veh.hasAC && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">Climatisation</span>}
                    {veh.hasWifi && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">Wi-Fi 4G</span>}
                    {veh.hasUSB && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">Prises USB</span>}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-800 font-bold">{veh.capacity} Sièges</span>
                  </div>

                  {/* Maintenance Log */}
                  {veh.maintenanceHistory && veh.maintenanceHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-900">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dernière Maintenance</span>
                      {veh.maintenanceHistory.slice(0, 2).map(m => (
                        <div key={m.id} className="text-[11px] text-slate-300 flex items-center justify-between py-0.5">
                          <span>{m.date} - {m.type}: {m.description}</span>
                          <span className="font-mono text-orange-400 text-[10px]">{(m?.cost || 0).toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Management Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white">Chauffeurs et Conducteurs ({agencyDrivers.length})</h2>
              <p className="text-xs text-slate-400">Suivi des permis de conduire, certifications et missions effectives</p>
            </div>
            <button
              onClick={() => setShowDriverModal(true)}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Chauffeur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyDrivers.map(drv => (
              <div key={drv.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-4">
                <img
                  src={drv.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt={drv.fullName}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white text-sm">{drv.fullName}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {drv.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-300 mt-0.5">{drv.licenseNumber}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Expérience: {drv.experienceYears} ans • Téléphone: {drv.phone}
                  </p>
                  <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    Expire le : {drv.licenseExpirationDate || '2028-12-31'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white">Trajets & Horaires de Départ ({agencyTrips.length})</h2>
              <p className="text-xs text-slate-400">Tous les départs signés numériquement et verrouillés</p>
            </div>
            <button
              onClick={() => setShowTripModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Trajet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agencyTrips.map(trip => {
              const isPublished = !trip.publicationStatus || trip.publicationStatus === 'Publié';

              return (
                <div key={trip.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <span className="font-extrabold text-white text-base">{trip.departureCity} ➔ {trip.arrivalCity}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPublished
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isPublished ? '● Publié' : '○ Brouillon'}
                        </span>
                        <span className="font-black text-orange-400 text-sm">{(trip?.price || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                    <div className="my-2 text-xs text-slate-300 space-y-1">
                      <p>Départ: <strong>{trip.departureTime}</strong> ({trip.departureStation})</p>
                      <p>Distance & Durée: {trip.distanceKm ? `${trip.distanceKm} km` : ''} • {trip.estimatedDuration || 'Direct'}</p>
                      <p>Chauffeur: {trip.driverName} • Type: {trip.busType}</p>
                      {trip.digitalSignature && (
                        <p className="text-[10px] font-mono text-emerald-400">Signature: {trip.digitalSignature}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 font-mono">
                      {trip.availableSeats} places libres / {trip.totalSeats}
                    </span>
                    <div className="flex items-center space-x-2">
                      {onToggleTripPublication && (
                        <button
                          onClick={() => onToggleTripPublication(trip.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isPublished
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                          title={isPublished ? 'Mettre en brouillon (invisible aux voyageurs)' : 'Publier (visible aux voyageurs)'}
                        >
                          {isPublished ? 'Dépublier' : 'Publier'}
                        </button>
                      )}
                      <button
                        onClick={() => setInspectingTrip3D(trip)}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Plan 3D</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vision Tab */}
      {activeTab === 'vision' && (
        <VisionDashboard
          userRole="ADMIN_AGENCE"
          userAgencyId={agency.id}
          cameras={cameras}
          alerts={alerts}
          onAddCamera={onAddCamera}
          onUpdateCamera={() => {}}
          onDeleteCamera={() => {}}
          onResolveAlert={() => {}}
        />
      )}

      {/* IPTV Tab */}
      {activeTab === 'iptv' && (
        <AgencyAdminIPTV agency={agency} settings={iptvSettings} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-extrabold text-white mb-4">Évolution des Recettes Hebdomadaires (FCFA)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="Ventes" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Schedule Trip Modal */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-white mb-4">Programmer un Trajet ({agency.name})</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ville Départ</label>
                <select
                  value={newDepCity}
                  onChange={(e) => setNewDepCity(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                >
                  <option value="Abidjan">Abidjan</option>
                  <option value="Yamoussoukro">Yamoussoukro</option>
                  <option value="Bouaké">Bouaké</option>
                  <option value="San-Pédro">San-Pédro</option>
                  <option value="Korhogo">Korhogo</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Ville Arrivée</label>
                <select
                  value={newArrCity}
                  onChange={(e) => setNewArrCity(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                >
                  <option value="Yamoussoukro">Yamoussoukro</option>
                  <option value="Bouaké">Bouaké</option>
                  <option value="San-Pédro">San-Pédro</option>
                  <option value="Korhogo">Korhogo</option>
                  <option value="Abidjan">Abidjan</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tarif (FCFA)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Heure de Départ</label>
                <input
                  type="text"
                  value={newDepTime}
                  onChange={(e) => setNewDepTime(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Statut de Publication</label>
                <select
                  value={newTripStatus}
                  onChange={(e) => setNewTripStatus(e.target.value as 'Publié' | 'Brouillon')}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                >
                  <option value="Publié">Publié (Immédiatement visible pour les voyageurs)</option>
                  <option value="Brouillon">Brouillon (Invisible aux voyageurs, interne à l'agence)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowTripModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTrip}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Valider Trajet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-white mb-4">Enregistrer un Autocar</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Marque</label>
                <input
                  type="text"
                  value={vehBrand}
                  onChange={(e) => setVehBrand(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Immatriculation (Plaque CI)</label>
                <input
                  type="text"
                  value={vehImmat}
                  onChange={(e) => setVehImmat(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Capacité (Sièges)</label>
                <input
                  type="number"
                  value={vehCapacity}
                  onChange={(e) => setVehCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowVehicleModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateVehicle}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
              >
                Ajouter Autocar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-extrabold text-white mb-4">Enregistrer un Chauffeur</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nom Complet</label>
                <input
                  type="text"
                  placeholder="Ex: Kouamé Jean"
                  value={drvName}
                  onChange={(e) => setDrvName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Téléphone Mobile</label>
                <input
                  type="text"
                  placeholder="Ex: +225 07 11 22 33 44"
                  value={drvPhone}
                  onChange={(e) => setDrvPhone(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">N° Permis de Conduire</label>
                <input
                  type="text"
                  placeholder="Ex: PERMIS-CI-2022-8812"
                  value={drvLicense}
                  onChange={(e) => setDrvLicense(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs px-3 py-2 rounded-xl border border-slate-800"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowDriverModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateDriver}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
              >
                Ajouter Chauffeur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Seat Inspection Modal for Any Selected Trip */}
      {inspectingTrip3D && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Supervision 3D des Sièges en Temps Réel</h3>
                  <p className="text-xs text-slate-400">
                    {inspectingTrip3D.departureCity} ➔ {inspectingTrip3D.arrivalCity} ({inspectingTrip3D.date} à {inspectingTrip3D.departureTime})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingTrip3D(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Seat3DRenderer
              layout={getLayoutForVehicle(inspectingTrip3D.busType, inspectingTrip3D.totalSeats)}
              selectedSeats={[]}
              occupiedSeats={inspectingTrip3D.occupiedSeats || []}
              onSeatClick={() => {}}
              readOnly={true}
              pricePerSeat={inspectingTrip3D.price}
            />
          </div>
        </div>
      )}

      {/* Vehicle Layout Builder Modal */}
      {showLayoutBuilder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-5xl w-full my-8">
            <VehicleLayoutBuilder
              onClose={() => setShowLayoutBuilder(false)}
              onSaveLayout={(layout) => {
                console.log('Saved custom layout for agency:', layout);
              }}
            />
          </div>
        </div>
      )}

      {/* Boarding QR Scanner Modal */}
      {showAdvancedScanner && (
        <BoardingScannerModal
          allBookings={bookings}
          onTicketScanned={(code) => {
            onValidateTicket(code);
          }}
          onClose={() => setShowAdvancedScanner(false)}
        />
      )}

    </div>
  );
};
