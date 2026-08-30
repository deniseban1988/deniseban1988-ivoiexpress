import React, { useState } from 'react';
import { BusTrip, TicketBooking } from '../../types';
import { TransportApiService } from '../../services/transportApi';
import { BoardingScanResult } from '../../types/seat3d';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Scan, 
  X, 
  Bus, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles,
  Camera
} from 'lucide-react';

interface BoardingScannerModalProps {
  currentTrip?: BusTrip | null;
  allBookings?: TicketBooking[];
  onTicketScanned?: (ticketCode: string) => void;
  onClose: () => void;
}

export const BoardingScannerModal: React.FC<BoardingScannerModalProps> = ({
  currentTrip,
  allBookings = [],
  onTicketScanned,
  onClose
}) => {
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<BoardingScanResult | null>(null);

  // Demo QR samples to test
  const demoTickets = allBookings.slice(0, 4);

  const handleProcessQR = async (qrString: string) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(async () => {
      // Check local DB if present
      const matchedBooking = allBookings.find(b => 
        qrString.includes(b.ticketCode) || b.ticketCode === qrString.trim()
      );

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      if (!matchedBooking) {
        // Test with API service
        const apiRes = await TransportApiService.verifyBoardingQR(qrString, currentTrip?.id);
        setScanResult(apiRes);
        setIsScanning(false);
        return;
      }

      // Check status
      if (matchedBooking.ticketStatus === 'Scanné / Utilisé') {
        setScanResult({
          status: 'ALREADY_USED',
          ticketCode: matchedBooking.ticketCode,
          passengerName: matchedBooking.passengerName,
          seatNumber: matchedBooking.seatNumber,
          tripId: matchedBooking.busTripId,
          scannedAt: now,
          message: `Attention : Ce billet (${matchedBooking.ticketCode}) a DÉJÀ ÉTÉ COMPTOIRÉ et validé.`
        });
      } else if (matchedBooking.ticketStatus === 'Annulé') {
        setScanResult({
          status: 'CANCELLED',
          ticketCode: matchedBooking.ticketCode,
          passengerName: matchedBooking.passengerName,
          seatNumber: matchedBooking.seatNumber,
          tripId: matchedBooking.busTripId,
          scannedAt: now,
          message: `Accès refusé : Ce billet a été ANNULÉ ou remboursé.`
        });
      } else if (currentTrip && matchedBooking.busTripId !== currentTrip.id) {
        setScanResult({
          status: 'WRONG_TRIP',
          ticketCode: matchedBooking.ticketCode,
          passengerName: matchedBooking.passengerName,
          seatNumber: matchedBooking.seatNumber,
          tripId: matchedBooking.busTripId,
          scannedAt: now,
          message: `Mauvais autocar ! Ce billet est enregistré pour la liaison ${matchedBooking.departureCity} ➔ ${matchedBooking.arrivalCity} (${matchedBooking.date} ${matchedBooking.departureTime}).`
        });
      } else {
        // Valid
        setScanResult({
          status: 'VALID',
          ticketCode: matchedBooking.ticketCode,
          passengerName: matchedBooking.passengerName,
          seatNumber: matchedBooking.seatNumber,
          tripId: matchedBooking.busTripId,
          tripDetails: `${matchedBooking.departureCity} (${matchedBooking.departureStation}) ➔ ${matchedBooking.arrivalCity}`,
          scannedAt: now,
          message: `Embarquement validé avec succès ! Bienvenue à bord.`
        });

        if (onTicketScanned) {
          onTicketScanned(matchedBooking.ticketCode);
        }
      }

      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 text-white space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
            <Scan className="w-3.5 h-3.5" />
            <span>Contrôle & Validation d'Embarquement</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Scanner de Billets QR Code</h2>
          <p className="text-xs text-slate-400">
            {currentTrip 
              ? `Liaison en cours : ${currentTrip.departureCity} ➔ ${currentTrip.arrivalCity} (${currentTrip.agencyName} - Départ ${currentTrip.departureTime})`
              : 'Mode Scanner Multi-Lignes National'}
          </p>
        </div>

        {/* Scanner Simulation Stage */}
        <div className="relative rounded-3xl bg-slate-950 border-2 border-dashed border-slate-800 p-8 flex flex-col items-center justify-center space-y-4 text-center overflow-hidden">
          
          {/* Animated Laser Scanning Line */}
          <div className="w-48 h-48 rounded-2xl bg-slate-900/80 border-2 border-orange-500/60 relative flex items-center justify-center shadow-inner overflow-hidden">
            <QrCode className="w-24 h-24 text-slate-700 opacity-60" />
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38BDF8] animate-pulse top-1/2 -translate-y-1/2" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300">Visez le QR Code du voyageur avec le lecteur optique</span>
            <p className="text-[11px] text-slate-500">Ou saisissez manuellement la référence ci-dessous</p>
          </div>

          {/* Manual Input form */}
          <div className="flex items-center space-x-2 max-w-md w-full">
            <input
              type="text"
              placeholder="Ex: TICK-CI-8821 ou coller le code..."
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
            />
            <button
              onClick={() => {
                if (manualCodeInput.trim()) {
                  handleProcessQR(manualCodeInput.trim());
                }
              }}
              disabled={isScanning || !manualCodeInput.trim()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-colors"
            >
              {isScanning ? 'Scan...' : 'Valider'}
            </button>
          </div>
        </div>

        {/* Scan Result Feedback Card */}
        {scanResult && (
          <div className={`p-4 rounded-2xl border transition-all animate-in fade-in zoom-in-95 duration-200 ${
            scanResult.status === 'VALID'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : scanResult.status === 'ALREADY_USED'
              ? 'bg-amber-950/60 border-amber-500 text-amber-100'
              : scanResult.status === 'WRONG_TRIP'
              ? 'bg-blue-950/60 border-blue-500 text-blue-100'
              : 'bg-red-950/60 border-red-500 text-red-100'
          }`}>
            <div className="flex items-start space-x-3">
              {scanResult.status === 'VALID' ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : scanResult.status === 'ALREADY_USED' ? (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-black">
                  <XCircle className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {scanResult.status === 'VALID' && '🟢 BILLET VALIDE — EMBARQUEMENT AUTORISÉ'}
                    {scanResult.status === 'ALREADY_USED' && '🟠 BILLET DÉJÀ UTILISÉ'}
                    {scanResult.status === 'CANCELLED' && '🔴 BILLET ANNULÉ'}
                    {scanResult.status === 'NON_EXISTENT' && '🔴 BILLET INEXISTANT'}
                    {scanResult.status === 'WRONG_TRIP' && '🔴 MAUVAIS VOYAGE'}
                  </span>
                  <span className="text-[10px] font-mono opacity-80">{scanResult.scannedAt}</span>
                </div>

                <p className="text-xs font-semibold">{scanResult.message}</p>

                {scanResult.passengerName && (
                  <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="opacity-70 block text-[10px]">Passager :</span>
                      <span className="font-bold">{scanResult.passengerName}</span>
                    </div>
                    <div>
                      <span className="opacity-70 block text-[10px]">Siège Réservé :</span>
                      <span className="font-extrabold text-orange-300 font-mono">#{scanResult.seatNumber}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Test Demo Tickets */}
        {demoTickets.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Tests Rapides de Validation (Billets Réels en Base)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => handleProcessQR(ticket.qrCodeData)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{ticket.passengerName}</span>
                    <span className="text-[10px] text-slate-400">{ticket.ticketCode} • Siège #{ticket.seatNumber}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    ticket.ticketStatus === 'Valide' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {ticket.ticketStatus}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
