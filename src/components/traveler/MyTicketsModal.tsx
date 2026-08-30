import React, { useState, useMemo } from 'react';
import { TicketBooking, HotelBooking, UserAccount } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Ticket, 
  Hotel, 
  Calendar, 
  MapPin, 
  Download, 
  CheckCircle2, 
  QrCode, 
  X, 
  Gift, 
  User, 
  Share2, 
  HeartHandshake, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface MyTicketsModalProps {
  ticketBookings: TicketBooking[];
  hotelBookings: HotelBooking[];
  currentUser?: UserAccount | null;
  onClose: () => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({ 
  ticketBookings, 
  hotelBookings, 
  currentUser,
  onClose 
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'MINE' | 'GIFTED'>('ALL');

  // Filter tickets based on current user context (Strict User Isolation)
  const filteredTickets = useMemo(() => {
    if (!currentUser) return ticketBookings;

    const userPhoneClean = currentUser.phone.replace(/[\s\-\+\(\)]/g, '');
    const userEmail = (currentUser.email || '').toLowerCase();

    return ticketBookings.filter(t => {
      const isPassenger = (
        t.passengerName.toLowerCase() === currentUser.fullName.toLowerCase() ||
        (t.passengerPhone && userPhoneClean.length >= 8 && t.passengerPhone.replace(/[\s\-\+\(\)]/g, '').endsWith(userPhoneClean)) ||
        (t.passengerEmail && userEmail && t.passengerEmail.toLowerCase() === userEmail) ||
        t.beneficiaryId === currentUser.id
      );

      const isBuyer = (
        t.buyerId === currentUser.id ||
        (t.buyerPhone && userPhoneClean.length >= 8 && t.buyerPhone.replace(/[\s\-\+\(\)]/g, '').endsWith(userPhoneClean)) ||
        (t.buyerEmail && userEmail && t.buyerEmail.toLowerCase() === userEmail) ||
        (t.isThirdPartyPurchase && t.buyerName?.toLowerCase() === currentUser.fullName.toLowerCase())
      );

      if (filterTab === 'MINE') {
        // Tickets where current user is the passenger/beneficiary
        return isPassenger;
      }
      if (filterTab === 'GIFTED') {
        // Tickets bought by user for someone else
        return isBuyer && t.isThirdPartyPurchase && !isPassenger;
      }

      // 'ALL': strictly tickets where user is either passenger or buyer
      return isPassenger || isBuyer;
    });
  }, [ticketBookings, currentUser, filterTab]);

  // Filter hotel bookings strictly for current user
  const filteredHotelBookings = useMemo(() => {
    if (!currentUser) return hotelBookings;
    const userPhoneClean = currentUser.phone.replace(/[\s\-\+\(\)]/g, '');
    const userEmail = (currentUser.email || '').toLowerCase();

    return hotelBookings.filter(h => {
      const isGuest = (
        h.guestName.toLowerCase() === currentUser.fullName.toLowerCase() ||
        (h.guestPhone && userPhoneClean.length >= 8 && h.guestPhone.replace(/[\s\-\+\(\)]/g, '').endsWith(userPhoneClean)) ||
        (h.guestEmail && userEmail && h.guestEmail.toLowerCase() === userEmail)
      );
      return isGuest;
    });
  }, [hotelBookings, currentUser]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-white">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Portefeuille Numérique IVOIReXpress</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Vos Billets & Réservations Sécurisés</h2>
          <p className="text-xs text-slate-400">
            Titres de transport certifiés et traçabilité complète des réservations personnelles et tierces.
          </p>
        </div>

        {/* Filter Tabs */}
        {currentUser && (
          <div className="flex items-center space-x-2 mb-6 border-b border-slate-800 pb-3">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                filterTab === 'ALL'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>Tous mes titres</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
                {ticketBookings.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('MINE')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                filterTab === 'MINE'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mes voyages</span>
            </button>

            <button
              onClick={() => setFilterTab('GIFTED')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
                filterTab === 'GIFTED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-emerald-400" />
              <span>Achetés pour des tiers</span>
            </button>
          </div>
        )}

        {/* Bus Tickets Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider flex items-center space-x-2">
              <span>Billets Autocars ({filteredTickets.length})</span>
            </h3>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center space-y-2">
              <Ticket className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 italic">Aucun billet de transport trouvé dans cette catégorie.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(ticket => {
                const isThirdParty = ticket.isThirdPartyPurchase;
                const isCurrentUserPassenger = currentUser && (
                  ticket.passengerName.toLowerCase() === currentUser.fullName.toLowerCase() ||
                  ticket.beneficiaryId === currentUser.id
                );

                return (
                  <div key={ticket.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 ivx-card-dark-shadow">
                    <div className="space-y-2 flex-1 w-full">
                      
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-orange-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {ticket.ticketCode}
                        </span>
                        
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {ticket.ticketStatus}
                        </span>

                        {isThirdParty && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 ${
                            isCurrentUserPassenger
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                            <Gift className="w-3 h-3" />
                            <span>
                              {isCurrentUserPassenger 
                                ? `Offert par ${ticket.buyerName || 'un tiers'}`
                                : `Acheté pour ${ticket.passengerName}`}
                            </span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-white">{ticket.passengerName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300">
                            Siège #{ticket.seatNumber}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-300">
                          {ticket.agencyName}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                        <p className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          <span>{ticket.departureCity} ➔ {ticket.arrivalCity}</span>
                        </p>
                        <p className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{ticket.date} à {ticket.departureTime}</span>
                        </p>
                      </div>

                      {/* Traceability & Attribution Info */}
                      {isThirdParty && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Acheteur (Payeur) :</span>
                            <span className="font-bold text-white">{ticket.buyerName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Voyageur (Titulaire) :</span>
                            <span className="font-bold text-emerald-400">{ticket.passengerName} ({ticket.passengerPhone})</span>
                          </div>
                          {ticket.transferNotes && (
                            <div className="text-[10px] text-orange-400 pt-1 border-t border-slate-800">
                              <em>Message : "{ticket.transferNotes}"</em>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => alert(`Téléchargement du billet PDF ${ticket.ticketCode} (${ticket.passengerName})...`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center space-x-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger PDF</span>
                        </button>
                        <button
                          onClick={() => alert(`Billet ${ticket.ticketCode} partagé via WhatsApp & SMS à ${ticket.passengerName} (${ticket.passengerPhone})`)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold transition-colors flex items-center space-x-1.5"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Partager</span>
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                      <QRCodeSVG value={ticket.qrCodeData} size={90} />
                      <span className="text-[9px] font-mono font-bold text-slate-900 mt-1">Pass Boarding</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hotel Reservations Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <span>Réservations Hôtelières ({filteredHotelBookings.length})</span>
          </h3>

          {filteredHotelBookings.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Aucune réservation d'hôtel enregistrée pour votre compte.</p>
          ) : (
            <div className="space-y-3">
              {filteredHotelBookings.map(h => (
                <div key={h.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between ivx-card-dark-shadow">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">{h.hotelName}</h4>
                    <p className="text-xs text-emerald-400 font-semibold">{h.roomType}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Titulaire: {h.guestName} ({h.guestPhone})
                    </p>
                    <p className="text-xs text-slate-500">
                      Séjour du {h.checkInDate} au {h.checkOutDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {h.status}
                    </span>
                    <p className="text-xs font-mono text-slate-400 mt-2">{h.totalPrice.toLocaleString()} FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Fermer le portefeuille
          </button>
        </div>

      </div>
    </div>
  );
};
