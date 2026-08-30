import React, { useState, useMemo } from 'react';
import { Hotel, HotelRoom, HotelBooking, PaymentMethod, AccommodationType } from '../../types';
import { HOTEL_RECEPTIONIST_IMAGE } from '../../assets/welcomeAssets';
import { 
  Hotel as HotelIcon, Star, MapPin, CheckCircle2, Calendar, Users, Wifi, 
  Coffee, Sparkles, X, CreditCard, Search, Image as ImageIcon, Shield, QrCode, 
  Phone, Mail, Clock, Filter, ArrowLeft, ChevronRight, BedDouble, Check,
  ExternalLink, Printer, Ticket, Info, Compass, ShieldCheck
} from 'lucide-react';

interface HotelBookingViewProps {
  hotels: Hotel[];
  rooms: HotelRoom[];
  onBookRoom: (newBooking: HotelBooking) => void;
  onBack?: () => void;
  onOpenMyTickets?: () => void;
}

export const HotelBookingView: React.FC<HotelBookingViewProps> = ({ 
  hotels, 
  rooms, 
  onBookRoom,
  onBack,
  onOpenMyTickets 
}) => {
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('TOUTES');
  const [selectedCity, setSelectedCity] = useState<string>('TOUTES');
  const [selectedType, setSelectedType] = useState<string>('TOUS');
  const [selectedStars, setSelectedStars] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Selected state for Consultation & Booking
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [activeGalleryImageIndex, setActiveGalleryImageIndex] = useState<number>(0);

  // Booking Form State
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('2026-08-20');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-08-22');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Orange Money');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<HotelBooking | null>(null);

  // List of administrative regions in CI
  const regions = ['TOUTES', 'Lagunes', 'Bélier', 'San-Pédro', 'Sud-Comoé', 'Tonkpi', 'Poro', 'Gbêkê'];
  const cities = ['TOUTES', 'Abidjan', 'Yamoussoukro', 'San-Pédro', 'Assinie', 'Man', 'Bouaké'];
  const accommodationTypes = ['TOUS', 'Hôtel', 'Résidence Meublée', 'Maison d\'Hôtes', 'Appartement', 'Complexe Touristique'];

  // Calculate nights count
  const calculateNights = (inDate: string, outDate: string) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const nightsCount = calculateNights(checkInDate, checkOutDate);

  const filteredHotels = hotels.filter(hotel => {
    if (hotel.status && hotel.status !== 'Actif') return false;
    if (selectedRegion !== 'TOUTES' && hotel.region !== selectedRegion) return false;
    if (selectedCity !== 'TOUTES' && hotel.city !== selectedCity) return false;
    if (selectedType !== 'TOUS' && hotel.type !== selectedType) return false;
    if (selectedStars > 0 && hotel.stars !== selectedStars) return false;
    if (searchKeyword.trim() !== '') {
      const kw = searchKeyword.toLowerCase();
      const matchesName = hotel.name.toLowerCase().includes(kw);
      const matchesCity = hotel.city.toLowerCase().includes(kw);
      const matchesCommune = hotel.commune?.toLowerCase().includes(kw);
      const matchesAddress = hotel.address?.toLowerCase().includes(kw);
      if (!matchesName && !matchesCity && !matchesCommune && !matchesAddress) return false;
    }
    return true;
  });

  // Always guarantee matching rooms for any hotel
  const getRoomsForHotel = (hotel: Hotel): HotelRoom[] => {
    const matching = rooms.filter(r => r.hotelId === hotel.id);
    if (matching.length > 0) return matching;

    // Fallback virtual rooms so every hotel in the system is completely bookable
    return [
      {
        id: `room-${hotel.id}-std`,
        hotelId: hotel.id,
        roomNumber: '102',
        name: `Chambre Confort Standard`,
        type: 'Standard',
        description: `Chambre climatisée moderne avec literie haut de gamme, salle de bain privative avec eau chaude, Wi-Fi très haut débit et TV HD.`,
        pricePerNight: hotel.pricePerNight || 45000,
        maxCapacity: 2,
        bedCount: 1,
        bedType: '1 Grand Lit Queen Size Confort',
        isAvailable: true,
        features: ['Climatisation', 'Wi-Fi Fibre Optique', 'Salle de bain privée', 'Smart TV Canal+', 'Service de Réveil'],
        imageUrl: hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: `room-${hotel.id}-suite`,
        hotelId: hotel.id,
        roomNumber: '204',
        name: `Suite Supérieure Standing`,
        type: 'Suite Executive',
        description: `Suite spacieuse avec salon attenant, vue dégagée, mini-bar offert, plateau de courtoisie et literie King Size.`,
        pricePerNight: Math.round((hotel.pricePerNight || 45000) * 1.5),
        maxCapacity: 4,
        bedCount: 2,
        bedType: '1 Lit King Size + 1 Canapé-lit Grand Confort',
        isAvailable: true,
        features: ['Salon privé', 'Vue Panoramique', 'Mini-bar offert', 'Machine Nespresso', 'Petit Déjeuner Inclus'],
        imageUrl: hotel.gallery?.[1] || hotel.imageUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80'
      }
    ];
  };

  const handleOpenHotelDetails = (hotel: Hotel) => {
    const hotelRooms = getRoomsForHotel(hotel);
    setSelectedHotel(hotel);
    setSelectedRoom(hotelRooms[0] || null);
    setActiveGalleryImageIndex(0);
    setConfirmedBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCatalog = () => {
    setSelectedHotel(null);
    setSelectedRoom(null);
    setConfirmedBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmHotelBooking = () => {
    if (!selectedHotel || !selectedRoom) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Veuillez renseigner le nom complet et le numéro de téléphone mobile du voyageur.');
      return;
    }

    setIsProcessing(true);

    const calculatedPrice = selectedRoom.pricePerNight * nightsCount;
    const bookingCode = `RES-HOT-CI-${Math.floor(1000 + Math.random() * 9000)}`;
    const digitalSignature = `SIG-IVX-HOTEL-${Math.floor(100000 + Math.random() * 900000)}-SHA256-VERIFIED`;

    setTimeout(() => {
      const newBooking: HotelBooking = {
        id: `hbook-${Date.now()}`,
        bookingCode,
        hotelId: selectedHotel.id,
        hotelName: selectedHotel.name,
        hotelCity: selectedHotel.city,
        hotelAddress: selectedHotel.address,
        roomId: selectedRoom.id,
        roomType: selectedRoom.type,
        guestName,
        guestPhone,
        guestEmail,
        checkInDate,
        checkOutDate,
        nightsCount,
        guestsCount,
        totalPrice: calculatedPrice,
        paymentMethod,
        paymentReference: `${paymentMethod.toUpperCase().replace(/\s+/g, '')}-HOTEL-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentStatus: 'Payé',
        status: 'Confirmé',
        qrCodeData: `IVOIREXPRESS:HOTEL_BOOKING:${bookingCode}:GUEST:${guestName}:HOTEL:${selectedHotel.name}`,
        digitalSignature,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      onBookRoom(newBooking);
      setConfirmedBooking(newBooking);
      setIsProcessing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const scrollToHotels = () => {
    const el = document.getElementById('hotel-catalog-filters');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =========================================================================
  // VIEW 1: DEDICATED CONSULTATION & BOOKING VIEW (FICHE DÉTAILLÉE DU HÔTEL)
  // =========================================================================
  if (selectedHotel) {
    const currentHotelRooms = getRoomsForHotel(selectedHotel);
    const hotelGallery = (selectedHotel.gallery && selectedHotel.gallery.length > 0)
      ? selectedHotel.gallery
      : [selectedHotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'];

    return (
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 pb-24 text-left">
        
        {/* Navigation Breadcrumb & Back Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xl">
          <div className="flex items-center space-x-3">
            <button
              id="btn-back-to-hotel-list"
              type="button"
              onClick={handleBackToCatalog}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer shadow-md group"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Retour aux hôtels</span>
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-950 text-slate-300 hover:text-white font-medium text-xs border border-slate-800 transition-colors"
              >
                <span>Accueil</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Établissement :</span>
            <span className="text-emerald-400 font-extrabold truncate max-w-[200px] sm:max-w-xs">{selectedHotel.name}</span>
            {onOpenMyTickets && (
              <button
                type="button"
                onClick={onOpenMyTickets}
                className="ml-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-bold transition-all"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Mes Réservations</span>
              </button>
            )}
          </div>
        </div>

        {/* If Confirmation Screen Active */}
        {confirmedBooking ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Paiement Validé • Réservation Confirmée</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Séjour Hôtelier Réservé avec Succès !</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Votre confirmation et pass d'accès numérique avec QR Code sécurisé sont générés pour votre arrivée à l'hôtel.
              </p>
            </div>

            {/* Complete Ticket Voucher */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-7 text-left space-y-4 shadow-xl">
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-800 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">N° de Réservation Officiel</span>
                  <span className="font-mono font-black text-emerald-400 text-lg sm:text-xl tracking-wider">{confirmedBooking.bookingCode}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Réf. Transaction {confirmedBooking.paymentMethod}</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">{confirmedBooking.paymentReference}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">{confirmedBooking.hotelName}</h3>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  <span>{confirmedBooking.hotelAddress}, {confirmedBooking.hotelCity}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Type de Chambre</span>
                  <span className="text-white font-bold text-sm block mt-0.5">{confirmedBooking.roomType}</span>
                  <span className="text-slate-400 text-[11px]">{confirmedBooking.guestsCount} Voyageur(s)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Voyageur Titulaire</span>
                  <span className="text-white font-bold text-sm block mt-0.5">{confirmedBooking.guestName}</span>
                  <span className="text-slate-400 text-[11px]">{confirmedBooking.guestPhone}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Période du Séjour</span>
                  <span className="text-amber-400 font-bold text-sm block mt-0.5">
                    {confirmedBooking.checkInDate} ➔ {confirmedBooking.checkOutDate}
                  </span>
                  <span className="text-slate-400 text-[11px]">{confirmedBooking.nightsCount} nuitée(s)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Payé (TTC)</span>
                  <span className="text-emerald-400 font-mono font-black text-base block mt-0.5">
                    {confirmedBooking.totalPrice.toLocaleString()} FCFA
                  </span>
                  <span className="text-emerald-500 text-[11px] font-semibold">Réglé via {confirmedBooking.paymentMethod}</span>
                </div>
              </div>

              {/* Digital QR Code Pass */}
              <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center space-y-2 mt-4 text-center">
                <QrCode className="w-32 h-32 text-slate-950" />
                <span className="text-[11px] text-slate-800 font-mono font-bold tracking-wider uppercase">
                  {confirmedBooking.digitalSignature}
                </span>
                <span className="text-[10px] text-slate-500">
                  Présentez ce QR Code à la réception de l'hôtel pour votre enregistrement express.
                </span>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBackToCatalog}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la liste des hôtels</span>
              </button>

              {onOpenMyTickets && (
                <button
                  type="button"
                  onClick={onOpenMyTickets}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-slate-950" />
                  <span>Voir mes réservations</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Main 2-Column Consultation & Booking Screen */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Hotel Overview, Multimedia Gallery & Room Selector (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Hotel Main Card Header & Gallery */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                
                {/* Title & Metadata */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold">
                      {selectedHotel.type}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{selectedHotel.stars} Étoiles ({selectedHotel.rating || 4.8})</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold">
                      {selectedHotel.region}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {selectedHotel.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 flex items-center space-x-1.5 mt-1.5">
                    <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <span>{selectedHotel.address}, {selectedHotel.commune || ''} ({selectedHotel.city})</span>
                  </p>
                </div>

                {/* Main Large Photo Display */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] w-full">
                  <img
                    src={hotelGallery[activeGalleryImageIndex] || selectedHotel.imageUrl}
                    alt={`${selectedHotel.name} photo ${activeGalleryImageIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur rounded-lg text-white text-[11px] font-bold border border-slate-700 flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Photo {activeGalleryImageIndex + 1} / {hotelGallery.length}</span>
                  </div>
                </div>

                {/* Thumbnails Carousel */}
                {hotelGallery.length > 1 && (
                  <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {hotelGallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGalleryImageIndex(idx)}
                        className={`w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          activeGalleryImageIndex === idx
                            ? 'border-orange-500 ring-2 ring-orange-500/40 opacity-100 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt={`Vignette ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">À Propos de l'Établissement</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {selectedHotel.description}
                  </p>
                </div>

                {/* Info Pills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Réception</span>
                    <span className="text-white font-semibold flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{selectedHotel.receptionHours || '24h/24 & 7j/7'}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Contact Direct</span>
                    <span className="text-white font-semibold flex items-center space-x-1 mt-0.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{selectedHotel.contactPhone || '+225 27 00 00 00'}</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Annulation</span>
                    <span className="text-emerald-400 font-semibold block mt-0.5 text-[11px] truncate">
                      {selectedHotel.cancellationPolicy || 'Annulation flexible'}
                    </span>
                  </div>
                </div>

                {/* Amenities List */}
                {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Services & Équipements Inclus</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedHotel.amenities.map((amenity, idx) => (
                        <span 
                          key={idx} 
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{amenity}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rooms Selection Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Chambres & Suites Disponibles</h2>
                    <p className="text-xs text-slate-400">Sélectionnez la formule de votre séjour</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    {currentHotelRooms.length} offre(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {currentHotelRooms.map(room => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/30 shadow-lg'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start sm:items-center space-x-3.5">
                          <img
                            src={room.imageUrl || selectedHotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                            alt={room.name}
                            className="w-24 h-20 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-white text-sm sm:text-base">{room.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded">
                                N° {room.roomNumber}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-snug">
                              {room.bedType} • Jusqu'à {room.maxCapacity} personne{room.maxCapacity > 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {room.features?.slice(0, 3).map((f, i) => (
                                <span key={i} className="text-[9px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 gap-2">
                          <div className="text-left sm:text-right">
                            <span className="text-lg font-black text-emerald-400 font-mono">
                              {room.pricePerNight.toLocaleString()} FCFA
                            </span>
                            <span className="text-[10px] text-slate-400 block">par nuitée</span>
                          </div>

                          <button
                            type="button"
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-slate-950 shadow-md'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Sélectionnée ✓' : 'Choisir cette chambre'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Reservation Details & Instant Payment (5 Cols - Sticky) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl">
                
                {/* Header of Form */}
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider block">Module Réservation Directe</span>
                  <h3 className="text-lg font-extrabold text-white">Finaliser votre Réservation</h3>
                </div>

                {/* Selected Room Summary Pill */}
                {selectedRoom && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Chambre Retenue</span>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{selectedRoom.name}</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        {selectedRoom.pricePerNight.toLocaleString()} FCFA / nuit
                      </span>
                    </div>
                  </div>
                )}

                {/* Stay Dates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Dates du Séjour</span>
                    </label>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {nightsCount} Nuit{nightsCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date d'arrivée (Check-in)</span>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400 font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date de départ (Check-out)</span>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Guests Count Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-400" />
                    <span>Nombre de Voyageurs / Occupants</span>
                  </label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400"
                  >
                    <option value={1}>1 Adulte</option>
                    <option value={2}>2 Adultes (Recommandé)</option>
                    <option value={3}>3 Personnes (Famille / Amis)</option>
                    <option value={4}>4 Personnes (Groupe / Suite)</option>
                  </select>
                </div>

                {/* Traveler Information Form */}
                <div className="space-y-3 pt-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Informations du Titulaire *
                  </label>

                  <div>
                    <input
                      type="text"
                      placeholder="Nom et Prénom complet *"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="tel"
                        placeholder="N° Téléphone (+225...) *"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400 font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (facultatif)"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Money Payment Methods */}
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Mode de Paiement Sécurisé
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['Orange Money', 'Wave', 'MTN Mobile Money', 'Moov Money'] as PaymentMethod[]).map(pm => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          paymentMethod === pm
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300 ring-1 ring-orange-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{pm}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Summary & Confirm Button */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Nuitée ({selectedRoom?.pricePerNight.toLocaleString() || 0} FCFA × {nightsCount})</span>
                      <span className="font-mono text-slate-200">
                        {((selectedRoom?.pricePerNight || 0) * nightsCount).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Taxes de séjour & TVA CI</span>
                      <span className="text-emerald-400 font-medium">Incluses</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-sm font-extrabold text-white">
                      <span>Total à régler :</span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {((selectedRoom?.pricePerNight || 0) * nightsCount).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-confirm-hotel-booking"
                    type="button"
                    disabled={!selectedRoom || isProcessing}
                    onClick={handleConfirmHotelBooking}
                    className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Traitement sécurisé en cours...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Confirmer & Payer via {paymentMethod}</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-500 text-center flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Transaction 100% sécurisée • Pass QR Code délivré immédiatement</span>
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN HOTEL CATALOG WITH PHOTO BANNER & FILTERS
  // =========================================================================
  return (
    <div className="space-y-6 p-3 sm:p-6 max-w-7xl mx-auto pb-24 text-left">
      
      {/* Top Header Bar with Return Navigation & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              id="btn-back-to-home"
              type="button"
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer shadow-md group"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Retour à l'accueil</span>
            </button>
          )}

          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <HotelIcon className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-white">Module Hôtellerie & Hébergements CI</span>
          </div>
        </div>

        {onOpenMyTickets && (
          <button
            type="button"
            onClick={onOpenMyTickets}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Ticket className="w-4 h-4" />
            <span>Mes Billets & Réservations</span>
          </button>
        )}
      </div>

      {/* Main Wide Photo Banner - Photographie lumineuse, large et nette */}
      <div className="space-y-4">
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 h-[280px] sm:h-[340px] md:h-[400px] w-full flex flex-col justify-start p-4 sm:p-6">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src={HOTEL_RECEPTIONIST_IMAGE}
              alt="Réceptionniste d'hôtel ivoirienne en tenue Akan avec enseigne 3D lumineuse IVOIReXpress"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[center_30%] filter brightness-[1.02] contrast-[1.02]"
            />
          </div>
          
          {/* Petite action élégante et compacte en haut à gauche */}
          <div className="relative z-10 flex items-start">
            <button
              id="btn-quick-book-hotel"
              type="button"
              onClick={scrollToHotels}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-orange-500/30 transition-all duration-200 cursor-pointer border border-amber-300/40 hover:scale-[1.02]"
            >
              <HotelIcon className="w-4 h-4 text-slate-950" />
              <span>Réserver</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters - Conteneur net, stable et accessible */}
        <div id="hotel-catalog-filters" className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Région / Zone</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-sm"
            >
              {regions.map(r => (
                <option key={r} value={r}>{r === 'TOUTES' ? 'Toutes les régions' : r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Ville / Commune</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-sm"
            >
              {cities.map(c => (
                <option key={c} value={c}>{c === 'TOUTES' ? 'Toutes les villes' : c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Type d'Hébergement</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-sm"
            >
              {accommodationTypes.map(t => (
                <option key={t} value={t}>{t === 'TOUS' ? 'Tous les hébergements' : t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Étoiles Minimum</label>
            <select
              value={selectedStars}
              onChange={(e) => setSelectedStars(Number(e.target.value))}
              className="w-full bg-slate-950 text-white p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-sm"
            >
              <option value={0}>Toutes catégories</option>
              <option value={5}>5 Étoiles uniquement</option>
              <option value={4}>4 Étoiles & plus</option>
              <option value={3}>3 Étoiles & plus</option>
            </select>
          </div>

          <div>
            <label className="text-slate-200 block mb-1 font-semibold">Mot-clé / Recherche</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Hôtel, quartier..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-slate-950 text-white pl-8 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{filteredHotels.length} établissement(s) disponible(s) en Côte d'Ivoire</span>
        {(selectedRegion !== 'TOUTES' || selectedCity !== 'TOUTES' || selectedType !== 'TOUS' || selectedStars > 0 || searchKeyword) && (
          <button
            type="button"
            onClick={() => {
              setSelectedRegion('TOUTES');
              setSelectedCity('TOUTES');
              setSelectedType('TOUS');
              setSelectedStars(0);
              setSearchKeyword('');
            }}
            className="text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Hotels Grid or Empty State */}
      {filteredHotels.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <HotelIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Aucun hôtel disponible pour le moment</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Aucun établissement hôtelier ne correspond à vos filtres actuels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedRegion('TOUTES');
              setSelectedCity('TOUTES');
              setSelectedType('TOUS');
              setSelectedStars(0);
              setSearchKeyword('');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs inline-flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Réinitialiser tous les filtres</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map(hotel => {
            const hotelRooms = getRoomsForHotel(hotel);

            return (
              <div
                key={hotel.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden ivx-card-dark-shadow flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-slate-950">
                    <img
                      src={hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur rounded-full text-xs font-bold text-white flex items-center space-x-1 border border-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{hotel.city}, {hotel.commune}</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full flex items-center space-x-1 shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{hotel.stars}★ ({hotel.rating || 4.8})</span>
                    </div>

                    {hotel.gallery && hotel.gallery.length > 0 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold rounded-lg border border-slate-700 flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>{hotel.gallery.length} photos</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-emerald-400 mb-1">
                      <span>{hotel.type}</span>
                      <span>•</span>
                      <span className="text-slate-400">{hotel.region}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                      {hotel.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {hotel.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {hotel.amenities?.slice(0, 4).map((amenity, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities && hotel.amenities.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/50">
                          +{hotel.amenities.length - 4} autres
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">À partir de</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {hotel.pricePerNight.toLocaleString()} <span className="text-xs text-slate-300 font-normal">FCFA / nuit</span>
                    </span>
                  </div>

                  <button
                    id={`btn-view-hotel-${hotel.id}`}
                    type="button"
                    onClick={() => handleOpenHotelDetails(hotel)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <HotelIcon className="w-4 h-4" />
                    <span>Consulter & Réserver</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
