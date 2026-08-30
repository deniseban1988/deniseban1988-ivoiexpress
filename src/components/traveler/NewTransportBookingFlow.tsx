import React, { useState, useEffect, useMemo } from 'react';
import { BusTrip, TicketBooking, PaymentMethod, UserAccount } from '../../types';
import { IVORIAN_CITY_HUBS, getLayoutForVehicle } from '../../data/transportData';
import { Seat3DRenderer } from './Seat3DRenderer';
import { TransportApiService } from '../../services/transportApi';
import { PassengerTravelerInfo, VehiclePhysicalLayout, SeatItem } from '../../types/seat3d';
import { INITIAL_USER_ACCOUNTS } from '../../core/infrastructure/repositories/AuthRepositoryAdapter';
import { QRCodeSVG } from 'qrcode.react';
import { resetScrollToTop } from '../../lib/navigationScroll';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Download, 
  Share2, 
  Printer, 
  RotateCcw, 
  Lock, 
  Timer, 
  Wifi, 
  Zap, 
  Crown, 
  Layers, 
  Ticket,
  Eye,
  X,
  Gift,
  UserCheck,
  Send,
  Smartphone,
  Mail,
  User,
  HeartHandshake
} from 'lucide-react';

interface NewTransportBookingFlowProps {
  trips: BusTrip[];
  onBookTickets: (newBookings: TicketBooking[]) => void;
  myBookings: TicketBooking[];
  currentUser?: UserAccount | null;
  onBookingStepChange?: (step: number | null) => void;
  onOpenMyTickets?: () => void;
}

export const NewTransportBookingFlow: React.FC<NewTransportBookingFlowProps> = ({
  trips,
  onBookTickets,
  myBookings,
  currentUser,
  onBookingStepChange,
  onOpenMyTickets
}) => {
  // Step State: 1 = Trajet, 2 = Voyage, 3 = Choix du siège 3D, 4 = Infos Voyageurs, 5 = Paiement, 6 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Trajet Filters
  const [departureCity, setDepartureCity] = useState<string>('Abidjan');
  const [departureStationId, setDepartureStationId] = useState<string>('all');
  const [arrivalCity, setArrivalCity] = useState<string>('Yamoussoukro');
  const [arrivalStationId, setArrivalStationId] = useState<string>('all');
  const [travelDate, setTravelDate] = useState<string>('2026-08-03');
  const [travelersCount, setTravelersCount] = useState<number>(1);

  // Step 2: Trip Filters & Selection
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('Toutes');
  const [comfortFilter, setComfortFilter] = useState<string>('Tous');
  const [selectedTrip, setSelectedTrip] = useState<BusTrip | null>(null);

  // Step 3: 3D Seat Selection & Atomic Locking
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [lockSessionId] = useState<string>(() => `lock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(0);
  const [lockError, setLockError] = useState<string | null>(null);

  // Step 4: Passenger Information (1 per traveler)
  const [passengers, setPassengers] = useState<PassengerTravelerInfo[]>([
    {
      id: 'p-1',
      seatNumber: 0,
      fullName: '',
      phone: '',
      email: '',
      isPmr: false,
      luggageCount: 1
    }
  ]);

  // Step 5: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Wave');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Step 6: Generated Bookings
  const [createdBookings, setCreatedBookings] = useState<TicketBooking[]>([]);

  // Notify parent shell of step change
  const setStepAndNotify = (step: number) => {
    setCurrentStep(step);
    resetScrollToTop();
    if (onBookingStepChange) {
      onBookingStepChange(step === 1 ? null : step);
    }
  };

  // Stations for selected departure and arrival cities
  const depHub = useMemo(() => IVORIAN_CITY_HUBS.find(h => h.city === departureCity), [departureCity]);
  const arrHub = useMemo(() => IVORIAN_CITY_HUBS.find(h => h.city === arrivalCity), [arrivalCity]);

  // Unique agencies present in actual trips matching route
  const availableAgenciesOnRoute = useMemo(() => {
    const names = new Set<string>();
    trips.forEach(t => {
      if (t.departureCity === departureCity && t.arrivalCity === arrivalCity) {
        if (!t.publicationStatus || t.publicationStatus === 'Publié') {
          names.add(t.agencyName);
        }
      }
    });
    return Array.from(names);
  }, [trips, departureCity, arrivalCity]);

  // Filtered trips matching search criteria (Only published, real trips)
  const availableTrips = useMemo(() => {
    return trips.filter(trip => {
      // Must be published (hide draft or cancelled trips from traveler)
      if (trip.publicationStatus && trip.publicationStatus !== 'Publié') return false;
      if (trip.departureCity !== departureCity) return false;
      if (trip.arrivalCity !== arrivalCity) return false;
      if (selectedAgencyFilter !== 'Toutes' && trip.agencyName !== selectedAgencyFilter) return false;
      if (comfortFilter !== 'Tous' && trip.busType !== comfortFilter) return false;
      return true;
    });
  }, [trips, departureCity, arrivalCity, selectedAgencyFilter, comfortFilter]);

  // Vehicle Layout for the selected trip
  const currentVehicleLayout: VehiclePhysicalLayout = useMemo(() => {
    if (!selectedTrip) return getLayoutForVehicle('Volvo Marcopolo G7 VIP', 32);
    return getLayoutForVehicle(selectedTrip.busType, selectedTrip.totalSeats);
  }, [selectedTrip]);

  // Real-time lock countdown timer
  useEffect(() => {
    if (!lockExpiresAt) {
      setLockSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lockExpiresAt - Date.now()) / 1000));
      setLockSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setLockError('Le délai de sélection de vos places a expiré. Veuillez choisir à nouveau vos places.');
        setSelectedSeats([]);
        setLockExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  // Keep passenger forms array synchronized with travelersCount & selected seats
  useEffect(() => {
    setPassengers(prev => {
      const updated: PassengerTravelerInfo[] = [];
      for (let i = 0; i < travelersCount; i++) {
        const assignedSeat = selectedSeats[i] || 0;
        if (prev[i]) {
          updated.push({
            ...prev[i],
            seatNumber: assignedSeat
          });
        } else {
          updated.push({
            id: `p-${i + 1}`,
            seatNumber: assignedSeat,
            fullName: '',
            phone: '',
            email: '',
            isPmr: false,
            luggageCount: 1
          });
        }
      }
      return updated;
    });
  }, [travelersCount, selectedSeats]);

  // Helper to detect if a phone number or email belongs to a registered IVOIReXpress user account
  const getMatchedUserAccount = (phone: string, email?: string): UserAccount | undefined => {
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanPhone && !cleanEmail) return undefined;

    return INITIAL_USER_ACCOUNTS.find(u => {
      const uPhone = u.phone.replace(/[\s\-\+\(\)]/g, '');
      const uEmail = u.email.trim().toLowerCase();
      if (cleanPhone && cleanPhone.length >= 8 && (uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone))) return true;
      if (cleanEmail && cleanEmail.length > 3 && uEmail === cleanEmail) return true;
      return false;
    });
  };

  // Step 4: Booking Target State ('SELF' or 'THIRD_PARTY')
  const [bookingTarget, setBookingTarget] = useState<'SELF' | 'THIRD_PARTY'>('SELF');
  const [thirdPartyGlobalNotes, setThirdPartyGlobalNotes] = useState<string>('');

  // Auto-fill traveler 1 when logged in and buying for oneself
  useEffect(() => {
    if (currentUser && bookingTarget === 'SELF') {
      setPassengers(prev => {
        if (prev.length > 0) {
          const next = [...prev];
          next[0] = {
            ...next[0],
            fullName: next[0].fullName || currentUser.fullName,
            phone: next[0].phone || currentUser.phone,
            email: next[0].email || currentUser.email,
            isForSelf: true
          };
          return next;
        }
        return prev;
      });
    }
  }, [currentUser, bookingTarget]);

  // Handle switching booking target
  const handleToggleBookingTarget = (target: 'SELF' | 'THIRD_PARTY') => {
    setBookingTarget(target);
    if (target === 'SELF') {
      setPassengers(prev => {
        const next = [...prev];
        if (next.length > 0) {
          next[0] = {
            ...next[0],
            fullName: currentUser ? currentUser.fullName : '',
            phone: currentUser ? currentUser.phone : '',
            email: currentUser ? currentUser.email : '',
            isForSelf: true
          };
        }
        return next;
      });
    } else {
      // Third Party
      setPassengers(prev => {
        return prev.map(p => ({
          ...p,
          fullName: p.fullName === currentUser?.fullName ? '' : p.fullName,
          phone: p.phone === currentUser?.phone ? '' : p.phone,
          email: p.email === currentUser?.email ? '' : p.email,
          isForSelf: false
        }));
      });
    }
  };
  const handleSelectTrip = (trip: BusTrip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setLockExpiresAt(null);
    setLockError(null);
    setStepAndNotify(3); // Go to Step 3: Choix du siège 3D
  };

  // Step 3: Handle 3D Seat Click
  const handleSeatClick = async (seatNumber: number, seatItem: SeatItem) => {
    if (!selectedTrip) return;

    let newSelection: number[];
    if (selectedSeats.includes(seatNumber)) {
      // Deselect
      newSelection = selectedSeats.filter(s => s !== seatNumber);
    } else {
      if (selectedSeats.length >= travelersCount) {
        // Replace oldest or keep max
        newSelection = [...selectedSeats.slice(1), seatNumber];
      } else {
        newSelection = [...selectedSeats, seatNumber];
      }
    }

    setSelectedSeats(newSelection);
    setLockError(null);

    // Request server-side atomic lock if seats are selected
    if (newSelection.length > 0) {
      const lockRes = await TransportApiService.lockSeats(selectedTrip.id, newSelection, lockSessionId, 600);
      if (lockRes.success) {
        setLockExpiresAt(lockRes.expiresAt);
      } else {
        setLockError(lockRes.message || 'Ces places ne sont plus disponibles. Veuillez en sélectionner d\'autres.');
      }
    } else {
      await TransportApiService.unlockSeats(selectedTrip.id, selectedSeats, lockSessionId);
      setLockExpiresAt(null);
    }
  };

  // Step 3 -> Step 4 validation
  const handleProceedFromSeats = () => {
    if (selectedSeats.length !== travelersCount) {
      setLockError(`Veuillez sélectionner ${travelersCount} fauteuil(s) 3D pour vos ${travelersCount} voyageur(s).`);
      return;
    }
    setStepAndNotify(4); // Go to Step 4: Infos Voyageurs
  };

  // Step 4 -> Step 5 validation
  const handleProceedToPayment = () => {
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName.trim() || !p.phone.trim()) {
        alert(`Veuillez renseigner le nom complet et le numéro de téléphone pour le Passager #${i + 1}.`);
        return;
      }
    }
    setStepAndNotify(5); // Go to Step 5: Paiement
  };

  // Step 5: Process Payment & Generate Verified Digital Tickets
  const handleConfirmPayment = () => {
    if (!selectedTrip || selectedSeats.length === 0) return;
    setIsProcessingPayment(true);
    setPaymentError(null);

    setTimeout(() => {
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const generatedList: TicketBooking[] = [];

      passengers.forEach((p, idx) => {
        const ticketCode = `TICK-CI-${Math.floor(1000 + Math.random() * 9000)}`;
        const digitalSig = `SIG-IVX-TICK-${Math.floor(1000 + Math.random() * 9000)}-SHA256-${Date.now().toString(36).toUpperCase()}`;
        
        const isThirdParty = bookingTarget === 'THIRD_PARTY' || p.isForSelf === false;
        const matchedUser = getMatchedUserAccount(p.phone, p.email);

        const buyerName = currentUser?.fullName || (isThirdParty ? 'Acheteur (Non titulaire)' : p.fullName);
        const buyerPhone = currentUser?.phone || '';
        const buyerEmail = currentUser?.email || '';
        const buyerId = currentUser?.id || 'guest-buyer';

        const booking: TicketBooking = {
          id: `book-${Date.now()}-${idx}`,
          ticketCode,
          passengerName: p.fullName,
          passengerPhone: p.phone,
          passengerEmail: p.email || '',
          seatNumber: p.seatNumber,
          busTripId: selectedTrip.id,
          agencyId: selectedTrip.agencyId,
          agencyName: selectedTrip.agencyName,
          departureCity: selectedTrip.departureCity,
          arrivalCity: selectedTrip.arrivalCity,
          departureStation: depHub?.stations.find(s => s.id === departureStationId)?.name || selectedTrip.departureStation,
          arrivalStation: arrHub?.stations.find(s => s.id === arrivalStationId)?.name || selectedTrip.arrivalStation,
          date: travelDate || selectedTrip.date,
          departureTime: selectedTrip.departureTime,
          price: selectedTrip.price,
          paymentMethod,
          paymentReference: `${paymentMethod.toUpperCase().replace(/\s+/g, '')}-CI-TX-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentStatus: 'Payé',
          ticketStatus: 'Valide',
          digitalSignature: digitalSig,
          createdAt: nowStr,
          qrCodeData: `IVOIREXPRESS:${ticketCode}:SIG:${digitalSig}:PASSENGER:${p.fullName}:TRIP:${selectedTrip.id}:SEAT:${p.seatNumber}${isThirdParty ? `:BUYER:${buyerName}` : ''}`,

          // Traçabilité Achat Tiers & Attribution Bénéficiaire
          isThirdPartyPurchase: isThirdParty,
          buyerId,
          buyerName,
          buyerPhone,
          buyerEmail,
          beneficiaryId: matchedUser ? matchedUser.id : (isThirdParty ? undefined : currentUser?.id),
          beneficiaryName: p.fullName,
          beneficiaryPhone: p.phone,
          beneficiaryEmail: p.email || '',
          attributionStatus: isThirdParty ? (matchedUser ? 'DIRECT_ACCOUNT' : 'PENDING_CLAIM') : 'SELF',
          claimToken: `CLAIM-IVX-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          beneficiaryNotified: true,
          transferNotes: p.notes || thirdPartyGlobalNotes || ''
        };
        generatedList.push(booking);
      });

      onBookTickets(generatedList);
      setCreatedBookings(generatedList);
      setIsProcessingPayment(false);
      setStepAndNotify(6); // Step 6: Confirmation
    }, 1400);
  };

  // Reset or Cancel Booking Flow
  const handleCancelBooking = async () => {
    if (selectedTrip && selectedSeats.length > 0) {
      await TransportApiService.unlockSeats(selectedTrip.id, selectedSeats, lockSessionId);
    }
    setSelectedTrip(null);
    setSelectedSeats([]);
    setLockExpiresAt(null);
    setStepAndNotify(1);
  };

  // Calculate pricing breakdown
  const totalPrice = useMemo(() => {
    if (!selectedTrip) return 0;
    return selectedTrip.price * travelersCount;
  }, [selectedTrip, travelersCount]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Breadcrumbs & Step Progress Bar - Elegant Black Theme */}
      <div 
        id="booking-steps-progress-bar"
        className="bg-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl shadow-black/40 relative overflow-hidden"
      >
        {/* Subtle ambient glow */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between overflow-x-auto pb-1 sm:pb-0 gap-1.5 sm:gap-2.5 scrollbar-none relative z-10">
          {[
            { num: 1, title: 'Trajet' },
            { num: 2, title: 'Voyage' },
            { num: 3, title: 'Sièges' },
            { num: 4, title: 'Voyageurs' },
            { num: 5, title: 'Paiement' },
            { num: 6, title: 'Confirmation' }
          ].map((step, idx, arr) => {
            const isDone = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isFuture = currentStep < step.num;

            return (
              <React.Fragment key={step.num}>
                <button 
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    if (isDone) {
                      setStepAndNotify(step.num);
                    }
                  }}
                  className={`flex items-center space-x-2 whitespace-nowrap px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-200 ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white font-black shadow-lg shadow-orange-500/30 ring-2 ring-orange-400'
                      : isDone
                      ? 'bg-slate-900/90 hover:bg-slate-850 text-white font-bold border border-emerald-500/40 hover:border-emerald-400/70 cursor-pointer'
                      : 'bg-slate-900/30 text-slate-400 border border-slate-800/60 cursor-not-allowed opacity-65'
                  }`}
                >
                  <span className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 transition-colors ${
                    isCurrent 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : isDone 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}>
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : step.num}
                  </span>
                  <span className={`text-xs sm:text-sm tracking-tight ${
                    isCurrent ? 'text-white font-extrabold' : isDone ? 'text-slate-200 font-bold' : 'text-slate-400 font-medium'
                  }`}>
                    {step.title}
                  </span>
                </button>

                {/* Subtle divider between steps on wider screens */}
                {idx < arr.length - 1 && (
                  <div className="hidden xl:flex items-center text-slate-700 px-0.5">
                    <ChevronRight className={`w-3 h-3 ${isDone ? 'text-emerald-500/60' : 'text-slate-700'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Lock Timer Warning Badge in Tunnel */}
        {lockExpiresAt && currentStep >= 3 && currentStep <= 5 && (
          <div className="mt-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 animate-in fade-in backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span className="font-semibold text-white">Vos {selectedSeats.length} place(s) vous sont réservées pendant :</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-xs shadow-md shadow-amber-500/20">
              {Math.floor(lockSecondsRemaining / 60)}:{(lockSecondsRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ÉTAPE 1 : RECHERCHE DU TRAJET & STATIONS */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          
          {/* Hero Search Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] shadow-sm relative overflow-hidden">
            <div className="max-w-3xl space-y-2 mb-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FFE7D1] text-[#9A3412] text-xs font-bold">
                <Bus className="w-3.5 h-3.5 text-[#F5821F]" />
                <span>Transport Interurbain & Régional - Côte d'Ivoire</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">
                Réservez Votre Billet de Car avec Fauteuils 3D
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Choisissez votre itinéraire, visualisez l'autocar en 3D et recevez instantanément votre billet numérique avec QR Code vérifiable.
              </p>
            </div>

            {/* Structured Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#F8FAFC] p-5 rounded-3xl border border-[#E5E7EB]">
              
              {/* Departure City & Station */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                  Ville de Départ
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#F5821F] absolute left-3 top-2.5" />
                    <select
                      value={departureCity}
                      onChange={(e) => setDepartureCity(e.target.value)}
                      className="w-full bg-white text-[#1F2937] text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#F5821F]"
                    >
                      {IVORIAN_CITY_HUBS.map(h => (
                        <option key={h.city} value={h.city}>{h.city} ({h.region})</option>
                      ))}
                    </select>
                  </div>

                  {depHub && depHub.stations.length > 0 && (
                    <select
                      value={departureStationId}
                      onChange={(e) => setDepartureStationId(e.target.value)}
                      className="w-full bg-white text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E7EB]"
                    >
                      <option value="all">Toutes les stations ({depHub.city})</option>
                      {depHub.stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Destination City & Station */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                  Destination
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                    <select
                      value={arrivalCity}
                      onChange={(e) => setArrivalCity(e.target.value)}
                      className="w-full bg-white text-[#1F2937] text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-emerald-500"
                    >
                      {IVORIAN_CITY_HUBS.map(h => (
                        <option key={h.city} value={h.city}>{h.city} ({h.region})</option>
                      ))}
                    </select>
                  </div>

                  {arrHub && arrHub.stations.length > 0 && (
                    <select
                      value={arrivalStationId}
                      onChange={(e) => setArrivalStationId(e.target.value)}
                      className="w-full bg-white text-slate-600 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E7EB]"
                    >
                      <option value="all">Toutes les gares ({arrHub.city})</option>
                      {arrHub.stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                  Date du Voyage
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#F5821F] absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full bg-white text-[#1F2937] text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#F5821F]"
                  />
                </div>
              </div>

              {/* Number of Travelers */}
              <div>
                <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                  Voyageurs
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#F5821F] absolute left-3 top-2.5" />
                  <select
                    value={travelersCount}
                    onChange={(e) => setTravelersCount(parseInt(e.target.value, 10))}
                    className="w-full bg-white text-[#1F2937] text-xs font-bold pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#F5821F]"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''} ({n} siège{n > 1 ? 's' : ''})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Submit to Step 2 */}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                <span className="font-bold text-[#F5821F]">{availableTrips.length} départs disponibles</span> pour {departureCity} ➔ {arrivalCity}
              </span>

              <button
                onClick={() => setStepAndNotify(2)}
                className="px-6 py-3 rounded-2xl bg-[#F5821F] hover:bg-[#EA580C] text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
              >
                <span>Rechercher les Voyages Disponibles</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Access to My Tickets Banner */}
          {myBookings.length > 0 && onOpenMyTickets && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 border border-slate-700 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold">Vous avez {myBookings.length} billet(s) actif(s)</h4>
                  <p className="text-xs text-slate-400">Consultez vos QR Codes d'embarquement et détails de trajets.</p>
                </div>
              </div>
              <button
                onClick={onOpenMyTickets}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition-colors"
              >
                Voir Mes Billets
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 2 : CHOIX DU VOYAGE & FILTRES */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          
          {/* Trip Summary Bar & Back */}
          <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStepAndNotify(1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Modifier les critères de recherche"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {departureCity} ➔ {arrivalCity}
                </h2>
                <p className="text-xs text-slate-500">
                  Date : <span className="font-bold text-slate-700">{travelDate}</span> • {travelersCount} voyageur(s)
                </p>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={selectedAgencyFilter}
                onChange={(e) => setSelectedAgencyFilter(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="Toutes">Toutes les compagnies {availableAgenciesOnRoute.length > 0 ? `(${availableAgenciesOnRoute.length})` : ''}</option>
                {availableAgenciesOnRoute.map(agName => (
                  <option key={agName} value={agName}>{agName}</option>
                ))}
              </select>

              <select
                value={comfortFilter}
                onChange={(e) => setComfortFilter(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="Tous">Tous les conforts</option>
                <option value="VIP Standard">VIP Standard</option>
                <option value="Business Class">Business Class</option>
                <option value="Luxe Climatisé">Luxe Climatisé</option>
              </select>
            </div>
          </div>

          {/* Available Trips Grid */}
          <div className="space-y-3">
            {availableTrips.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#F5821F] border border-orange-100 flex items-center justify-center mx-auto">
                  <Bus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Aucun voyage disponible pour le moment</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Aucun voyage n'a encore été publié par une compagnie de transport autorisée pour l'itinéraire <span className="font-bold text-slate-700">{departureCity} ➔ {arrivalCity}</span> à la date du <span className="font-bold text-slate-700">{travelDate}</span>.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setStepAndNotify(1)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow transition-all flex items-center space-x-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Modifier la recherche</span>
                  </button>
                  {(selectedAgencyFilter !== 'Toutes' || comfortFilter !== 'Tous') && (
                    <button
                      onClick={() => { setSelectedAgencyFilter('Toutes'); setComfortFilter('Tous'); }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              </div>
            ) : (
              availableTrips.map(trip => (
                <div
                  key={trip.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-orange-400 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  {/* Agency & Vehicle Info */}
                  <div className="flex items-center space-x-4 w-full md:w-auto">
                    <img
                      src={trip.agencyLogo}
                      alt={trip.agencyName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900">{trip.agencyName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-100 text-orange-800">
                          {trip.busType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Départ : <span className="font-semibold text-slate-700">{trip.departureStation}</span>
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Wifi className="w-3 h-3 text-emerald-600" />
                          <span>Wi-Fi 4G</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-orange-500" />
                          <span>Prises USB</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{trip.availableSeats} places libres</span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Timeline */}
                  <div className="flex items-center justify-center space-x-4 w-full md:w-auto text-center">
                    <div>
                      <span className="text-lg font-black text-slate-900 font-mono">{trip.departureTime}</span>
                      <span className="block text-[10px] text-slate-400 uppercase">{trip.departureCity}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{trip.estimatedDuration}</span>
                      <div className="w-24 h-0.5 bg-orange-300 relative my-1">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#F5821F]" />
                      </div>
                      <span className="text-[9px] text-slate-400">{trip.distanceKm} km direct</span>
                    </div>

                    <div>
                      <span className="text-lg font-black text-slate-900 font-mono">{trip.arrivalTime}</span>
                      <span className="block text-[10px] text-slate-400 uppercase">{trip.arrivalCity}</span>
                    </div>
                  </div>

                  {/* Pricing & 3D Seat Selection CTA */}
                  <div className="flex items-center justify-between md:justify-end space-x-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Tarif unitaire</span>
                      <span className="text-xl font-black text-[#F5821F] font-mono">
                        {trip.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectTrip(trip)}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2"
                    >
                      <Layers className="w-4 h-4" />
                      <span>Choisir Sièges 3D</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 3 : CHOIX DU SIÈGE */}
      {/* ========================================================================= */}
      {currentStep === 3 && selectedTrip && (
        <div className="space-y-4">
          
          {/* Trip Header Banner - Compact & Clean */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStepAndNotify(2)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="Changer de voyage"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800">
                    {selectedTrip.agencyName}
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    {selectedTrip.departureCity} ➔ {selectedTrip.arrivalCity}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Départ à <span className="font-bold text-slate-800">{selectedTrip.departureTime}</span> • {travelersCount} place{travelersCount > 1 ? 's' : ''} à choisir
                </p>
              </div>
            </div>

            {/* Instruction Badge */}
            <div className="px-3.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>
                Choisissez vos {travelersCount} place{travelersCount > 1 ? 's' : ''} ({selectedSeats.length}/{travelersCount})
              </span>
            </div>
          </div>

          {/* Error / Conflict Feedback */}
          {lockError && (
            <div className="p-3.5 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{lockError}</span>
            </div>
          )}

          {/* Interactive Compact Seat Renderer */}
          <Seat3DRenderer
            layout={currentVehicleLayout}
            selectedSeats={selectedSeats}
            occupiedSeats={selectedTrip.occupiedSeats || []}
            maxSelectable={travelersCount}
            onSeatClick={handleSeatClick}
            pricePerSeat={selectedTrip.price}
          />

          {/* Action Bar Bottom */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] text-slate-400 block font-bold">Vos places</span>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {selectedSeats.length > 0 ? selectedSeats.map(s => `Siège #${s}`).join(' • ') : 'Sélectionnez sur le plan'}
                </span>
                {selectedSeats.length === travelersCount && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Complet
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleCancelBooking}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Annuler
              </button>

              <button
                onClick={handleProceedFromSeats}
                disabled={selectedSeats.length !== travelersCount}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F5821F] hover:bg-[#EA580C] disabled:opacity-40 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
              >
                <span>Étape suivante : Voyageurs</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 4 : INFORMATIONS VOYAGEURS & ATTRIBUTION BÉNÉFICIAIRE */}
      {/* ========================================================================= */}
      {currentStep === 4 && selectedTrip && (
        <div className="space-y-6">
          
          {/* Header Navigation */}
          <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStepAndNotify(3)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900">Renseignements des Titulaires</h2>
                <p className="text-xs text-slate-500">Précisez le destinataire et les informations nominatives de chaque titre de transport.</p>
              </div>
            </div>
          </div>

          {/* Option : Pour qui achetez-vous ce billet ? */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-orange-400 block">
                  Attribution du Billet & Titularité
                </span>
                <h3 className="text-base font-extrabold text-white">Pour qui achetez-vous ce billet ?</h3>
              </div>
              {currentUser && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full self-start">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Connecté : <strong>{currentUser.fullName}</strong></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Pour moi */}
              <button
                type="button"
                onClick={() => handleToggleBookingTarget('SELF')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  bookingTarget === 'SELF'
                    ? 'border-orange-500 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      bookingTarget === 'SELF' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-sm block text-white">Pour moi</span>
                      <span className="text-xs text-slate-400">Je suis le voyageur à bord</span>
                    </div>
                  </div>
                  {bookingTarget === 'SELF' && (
                    <CheckCircle2 className="w-5 h-5 text-orange-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
                  Le billet est associé directement à votre identité et enregistré dans votre espace personnel.
                </p>
              </button>

              {/* Option 2: Pour une autre personne */}
              <button
                type="button"
                onClick={() => handleToggleBookingTarget('THIRD_PARTY')}
                className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  bookingTarget === 'THIRD_PARTY'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                      bookingTarget === 'THIRD_PARTY' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-black text-sm block text-white">Pour une autre personne</span>
                      <span className="text-xs text-emerald-400 font-semibold">Achat pour un proche / tiers</span>
                    </div>
                  </div>
                  {bookingTarget === 'THIRD_PARTY' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-3 border-t border-white/5 pt-2">
                  Vous payez le billet. Le titre apparaîtra automatiquement dans l'espace « Mes billets » du voyageur !
                </p>
              </button>
            </div>

            {/* Information Notice for Third-Party Purchasing */}
            {bookingTarget === 'THIRD_PARTY' && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-100 flex items-start space-x-3 animate-in fade-in duration-200">
                <HeartHandshake className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-extrabold text-emerald-300 block">Attribution automatique & Traçabilité complète</span>
                  <p className="text-emerald-200/90 leading-relaxed">
                    Renseignez le numéro de téléphone ou l'email du bénéficiaire ci-dessous. Dès confirmation du paiement, 
                    <strong> le billet lui sera attribué sans qu'il n'ait à payer</strong>, et vous conserverez l'historique complet de la transaction.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Passenger Forms Grid */}
          <div className="grid grid-cols-1 gap-4">
            {passengers.map((p, idx) => {
              const matchedAccount = getMatchedUserAccount(p.phone, p.email);
              const isThirdPartyPassenger = bookingTarget === 'THIRD_PARTY' || p.isForSelf === false;

              return (
                <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        isThirdPartyPassenger ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">
                          {isThirdPartyPassenger ? `Bénéficiaire Voyageur #${idx + 1}` : `Voyageur #${idx + 1}`}
                        </span>
                        {isThirdPartyPassenger && (
                          <span className="text-[10px] text-emerald-600 font-bold ml-2">
                            (Billet payé pour un tiers)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {travelersCount > 1 && (
                        <select
                          value={p.isForSelf === false ? 'other' : 'self'}
                          onChange={(e) => {
                            const isForOther = e.target.value === 'other';
                            setPassengers(prev => prev.map((item, i) => i === idx ? {
                              ...item,
                              isForSelf: !isForOther,
                              fullName: !isForOther && currentUser ? currentUser.fullName : item.fullName,
                              phone: !isForOther && currentUser ? currentUser.phone : item.phone,
                              email: !isForOther && currentUser ? currentUser.email : item.email
                            } : item));
                          }}
                          className="bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl px-2.5 py-1"
                        >
                          <option value="self">Pour moi</option>
                          <option value="other">Pour une tierce personne</option>
                        </select>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-blue-100 text-blue-900">
                        Fauteuil 3D #{p.seatNumber}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isThirdPartyPassenger ? 'Nom & Prénoms du Bénéficiaire *' : 'Nom et Prénoms *'}
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: KOUAME Koffi Jean"
                        value={p.fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassengers(prev => prev.map((item, i) => i === idx ? { ...item, fullName: val } : item));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isThirdPartyPassenger ? 'Téléphone Mobile du Bénéficiaire *' : 'Numéro de Téléphone *'}
                      </label>
                      <input
                        type="tel"
                        placeholder="Ex: +225 07 08 09 10 11"
                        value={p.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassengers(prev => prev.map((item, i) => i === idx ? { ...item, phone: val } : item));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {isThirdPartyPassenger ? 'Email du Bénéficiaire (Optionnel)' : 'Email (pour réception billet)'}
                      </label>
                      <input
                        type="email"
                        placeholder="Ex: voyageur@ivoirexpress.ci"
                        value={p.email || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassengers(prev => prev.map((item, i) => i === idx ? { ...item, email: val } : item));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Real-time Account Lookup Feedback Banner */}
                  {isThirdPartyPassenger && (p.phone.trim().length >= 8 || (p.email && p.email.includes('@'))) && (
                    <div className="pt-2">
                      {matchedAccount ? (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-3 text-xs">
                          <UserCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <span className="font-extrabold block">
                              Compte IVOIReXpress vérifié : {matchedAccount.fullName} ({matchedAccount.phone})
                            </span>
                            <span className="text-emerald-700 text-[11px]">
                              ✓ Le billet sera automatiquement synchronisé dans son espace « Mes Billets ».
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-300 text-sky-900 flex items-center space-x-3 text-xs">
                          <Smartphone className="w-5 h-5 text-sky-600 flex-shrink-0" />
                          <div>
                            <span className="font-extrabold block">
                              Attribution mobile sécurisée ({p.phone})
                            </span>
                            <span className="text-sky-700 text-[11px]">
                              Le bénéficiaire pourra récupérer son billet à tout moment avec son numéro ou accéder via le SMS/QR Code généré.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Note / Message for Third Party */}
                  {isThirdPartyPassenger && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Message d'accompagnement ou note personnalisée (Optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bon voyage Maman ! / Billet pour la formation de lundi"
                        value={p.notes || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPassengers(prev => prev.map((item, i) => i === idx ? { ...item, notes: val } : item));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center space-x-4 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={p.isPmr || false}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setPassengers(prev => prev.map((item, i) => i === idx ? { ...item, isPmr: val } : item));
                        }}
                        className="accent-orange-500 rounded"
                      />
                      <span>Assistance Mobilité Réduite (PMR) requise à l'embarquement</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200 flex items-center justify-between shadow-sm">
            <button
              onClick={() => setStepAndNotify(3)}
              className="px-4 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
            >
              Retour aux Sièges
            </button>

            <button
              onClick={handleProceedToPayment}
              className="px-6 py-3 rounded-2xl bg-[#F5821F] hover:bg-[#EA580C] text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
            >
              <span>Continuer vers le Paiement</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 5 : RÉCAPITULATIF & PAIEMENT SÉCURISÉ */}
      {/* ========================================================================= */}
      {currentStep === 5 && selectedTrip && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-5 border border-[#E5E7EB] flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setStepAndNotify(4)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900">Paiement & Traçabilité</h2>
                <p className="text-xs text-slate-500">Choisissez votre moyen de paiement sécurisé pour émettre et attribuer vos billets.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Summary Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 text-orange-400 text-xs font-black uppercase tracking-wider">
                <Ticket className="w-4 h-4" />
                <span>Récapitulatif de Commande</span>
              </div>

              {/* Acheteur vs Voyageurs */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Acheteur (Payeur) :</span>
                  <span className="font-extrabold text-white">{currentUser?.fullName || (bookingTarget === 'SELF' ? passengers[0]?.fullName : 'Acheteur Web')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Type d'achat :</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    bookingTarget === 'THIRD_PARTY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {bookingTarget === 'THIRD_PARTY' ? 'Achat pour un tiers' : 'Achat personnel'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Compagnie :</span>
                  <span className="font-extrabold text-white">{selectedTrip.agencyName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Trajet :</span>
                  <span className="font-extrabold text-white">{selectedTrip.departureCity} ➔ {selectedTrip.arrivalCity}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Date & Heure :</span>
                  <span className="font-extrabold text-white">{travelDate} à {selectedTrip.departureTime}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Sièges Réservés :</span>
                  <span className="font-mono font-extrabold text-orange-400">
                    {selectedSeats.map(s => `#${s}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Titulaire(s) du Billet :</span>
                  <span className="font-bold text-slate-200">
                    {passengers.map(p => p.fullName || 'Passager').join(', ')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Tarif par billet :</span>
                  <span className="font-mono text-slate-300">{selectedTrip.price.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-black">
                <span className="text-slate-300">Montant Total :</span>
                <span className="text-2xl font-black text-orange-400 font-mono">
                  {totalPrice.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            {/* Right: Payment Method Selector (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">Sélectionnez le mode de règlement</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Wave' as PaymentMethod, color: 'border-cyan-500 bg-cyan-50/40 text-cyan-950', badge: 'Sans Frais • Instantané' },
                  { name: 'Orange Money' as PaymentMethod, color: 'border-orange-500 bg-orange-50/40 text-orange-950', badge: '#144#' },
                  { name: 'MTN Mobile Money' as PaymentMethod, color: 'border-amber-500 bg-amber-50/40 text-amber-950', badge: '*133#' },
                  { name: 'Moov Money' as PaymentMethod, color: 'border-blue-500 bg-blue-50/40 text-blue-950', badge: '*155#' },
                  { name: 'Carte Bancaire' as PaymentMethod, color: 'border-slate-500 bg-slate-50 text-slate-900', badge: 'Visa / Mastercard' }
                ].map(m => (
                  <button
                    key={m.name}
                    onClick={() => setPaymentMethod(m.name)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                      paymentMethod === m.name
                        ? `${m.color} shadow-md`
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{m.name}</span>
                      {paymentMethod === m.name && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-semibold">{m.badge}</span>
                  </button>
                ))}
              </div>

              {/* Traceability Guarantee Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-2 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Traçabilité & Sécurité IVOIReXpress</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Chaque billet est certifié par signature numérique SHA-256 avec distinction entre l'acheteur (payeur) et le bénéficiaire (voyageur titulaire).
                </p>
              </div>

              {/* Confirm CTA */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Émission & Attribution des Billets...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-white" />
                      <span>Payer {totalPrice.toLocaleString()} FCFA & Émettre les Billets</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 6 : CONFIRMATION & BILLETS ÉLECTRONIQUES AVEC QR CODE */}
      {/* ========================================================================= */}
      {currentStep === 6 && createdBookings.length > 0 && (
        <div className="space-y-6">
          
          {/* Success Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white text-center shadow-xl space-y-2">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black">
              {createdBookings[0]?.isThirdPartyPurchase 
                ? 'Achat Effectué & Billet Attribué avec Succès !' 
                : 'Réservation Confirmée avec Succès !'}
            </h2>
            <p className="text-xs text-emerald-100 max-w-lg mx-auto">
              {createdBookings[0]?.isThirdPartyPurchase 
                ? `Vos ${createdBookings.length} billet(s) officiel(s) ont été émis et attribués aux voyageurs bénéficiaires avec traçabilité complète.`
                : `Vos ${createdBookings.length} billet(s) officiel(s) sont émis et enregistrés dans la base sécurisée IVOIReXpress.`}
            </p>
          </div>

          {/* Third-Party Attribution Status Banner */}
          {createdBookings[0]?.isThirdPartyPurchase && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black flex-shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Attribution au Bénéficiaire</h4>
                  <p className="text-xs text-slate-500">
                    Acheteur : <strong>{createdBookings[0].buyerName}</strong> • Titulaire : <strong>{createdBookings[0].passengerName}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {createdBookings[0].attributionStatus === 'DIRECT_ACCOUNT' ? '✓ Synchronisé sur son compte' : '✓ Attribué sur son mobile'}
                </span>
              </div>
            </div>
          )}

          {/* Generated Digital Boarding Passes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {createdBookings.map((b, idx) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-lg relative flex flex-col justify-between"
              >
                {/* Boarding Card Top */}
                <div className="bg-slate-900 text-white p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-orange-400 bg-slate-800 px-2.5 py-1 rounded-md">
                      {b.ticketCode}
                    </span>
                    <div className="flex items-center space-x-2">
                      {b.isThirdPartyPurchase && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Billet Bénéficiaire
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Confirmé
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{b.passengerName}</h4>
                      <p className="text-xs text-slate-400">{b.agencyName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Siège 3D</span>
                      <span className="text-2xl font-black text-orange-400 font-mono">#{b.seatNumber}</span>
                    </div>
                  </div>

                  {b.isThirdPartyPurchase && (
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Acheté par : <strong className="text-slate-200">{b.buyerName}</strong></span>
                      <span className="text-emerald-400 font-semibold">{b.attributionStatus === 'DIRECT_ACCOUNT' ? 'Compte lié' : 'Mobile lié'}</span>
                    </div>
                  )}
                </div>

                {/* Card Middle: Itinerary & QR Code */}
                <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-2 text-xs text-slate-700 flex-1">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span><strong>Départ :</strong> {b.departureCity} ({b.departureStation})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span><strong>Arrivée :</strong> {b.arrivalCity} ({b.arrivalStation})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{b.date} à <strong>{b.departureTime}</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      Paiement : {b.paymentMethod} ({b.paymentReference})
                    </div>
                    {b.transferNotes && (
                      <div className="text-[11px] text-orange-600 bg-orange-50 p-2 rounded-xl border border-orange-200">
                        <strong>Note :</strong> "{b.transferNotes}"
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center">
                    <QRCodeSVG value={b.qrCodeData} size={110} />
                    <span className="text-[9px] font-mono font-bold text-slate-900 mt-1">Pass Boarding</span>
                  </div>
                </div>

                {/* Card Bottom: Print & Share Actions */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">SIG: SHA-256 Validé</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alert(`Téléchargement du billet PDF ${b.ticketCode} pour ${b.passengerName}...`)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                      title="Télécharger Billet PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert(`Billet ${b.ticketCode} partagé via WhatsApp & SMS au voyageur ${b.passengerName} (${b.passengerPhone})`)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center space-x-1"
                      title="Transmettre au Bénéficiaire"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Partager au Voyageur</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                if (onOpenMyTickets) onOpenMyTickets();
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs shadow-lg transition-all flex items-center space-x-2"
            >
              <Ticket className="w-4 h-4 text-orange-400" />
              <span>Voir dans Mon Portefeuille Numérique</span>
            </button>

            <button
              onClick={handleCancelBooking}
              className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Effectuer une Nouvelle Réservation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
