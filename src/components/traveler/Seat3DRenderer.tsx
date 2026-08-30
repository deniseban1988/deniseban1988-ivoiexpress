import React, { useState, useMemo } from 'react';
import { VehiclePhysicalLayout, SeatItem, SeatState } from '../../types/seat3d';
import { 
  Check, 
  Layers, 
  Eye, 
  RotateCw, 
  Accessibility, 
  Crown, 
  Lock, 
  Info,
  Timer
} from 'lucide-react';

interface Seat3DRendererProps {
  layout: VehiclePhysicalLayout;
  selectedSeats: number[];
  occupiedSeats: number[];
  lockedSeats?: { seatNumber: number; expiresAt: number; isMyLock: boolean }[];
  blockedSeats?: number[];
  maxSelectable?: number;
  onSeatClick: (seatNumber: number, seatItem: SeatItem) => void;
  pricePerSeat?: number;
  showPricing?: boolean;
  className?: string;
  readOnly?: boolean;
}

type ViewPerspective = 'topdown' | 'perspective3d';

export const Seat3DRenderer: React.FC<Seat3DRendererProps> = ({
  layout,
  selectedSeats,
  occupiedSeats,
  lockedSeats = [],
  blockedSeats = [],
  maxSelectable = 1,
  onSeatClick,
  pricePerSeat = 5000,
  className = '',
  readOnly = false
}) => {
  const [activeDeck, setActiveDeck] = useState<1 | 2>(1);
  const [viewPerspective, setViewPerspective] = useState<ViewPerspective>('topdown');
  const [activeInfoSeat, setActiveInfoSeat] = useState<SeatItem | null>(null);

  // Filter seats by active deck
  const currentDeckSeats = useMemo(() => {
    return layout.seats.filter(s => s.deck === activeDeck);
  }, [layout.seats, activeDeck]);

  // Max rows for current deck
  const deckRows = useMemo(() => {
    return Math.max(...currentDeckSeats.map(s => s.row), layout.rowsCount);
  }, [currentDeckSeats, layout.rowsCount]);

  // Helper to compute effective state of a seat
  const getSeatEffectiveState = (seat: SeatItem): { state: SeatState; isMyLock: boolean; lockTimeRemaining?: number } => {
    if (blockedSeats.includes(seat.seatNumber) || seat.state === 'BLOCKED') {
      return { state: 'BLOCKED', isMyLock: false };
    }
    if (occupiedSeats.includes(seat.seatNumber) || seat.state === 'OCCUPIED') {
      return { state: 'OCCUPIED', isMyLock: false };
    }
    const lockedInfo = lockedSeats.find(l => l.seatNumber === seat.seatNumber);
    if (lockedInfo && lockedInfo.expiresAt > Date.now()) {
      const remainingSec = Math.max(0, Math.round((lockedInfo.expiresAt - Date.now()) / 1000));
      return { 
        state: 'LOCKED', 
        isMyLock: lockedInfo.isMyLock,
        lockTimeRemaining: remainingSec 
      };
    }
    if (selectedSeats.includes(seat.seatNumber)) {
      return { state: 'SELECTED', isMyLock: true };
    }
    if (seat.category === 'PMR') {
      return { state: 'PMR', isMyLock: false };
    }
    if (seat.category === 'VIP') {
      return { state: 'VIP', isMyLock: false };
    }
    return { state: 'AVAILABLE', isMyLock: false };
  };

  // Count availability
  const availableSeatsCount = useMemo(() => {
    return layout.seats.filter(s => {
      const { state } = getSeatEffectiveState(s);
      return state === 'AVAILABLE' || state === 'PMR' || state === 'VIP';
    }).length;
  }, [layout.seats, occupiedSeats, lockedSeats, blockedSeats, selectedSeats]);

  // Handle seat tap / click with instant feedback
  const handleSeatTap = (seat: SeatItem) => {
    setActiveInfoSeat(seat);
    const { state, isMyLock } = getSeatEffectiveState(seat);
    if (readOnly || state === 'OCCUPIED' || state === 'BLOCKED' || (state === 'LOCKED' && !isMyLock)) {
      return;
    }
    onSeatClick(seat.seatNumber, seat);
  };

  return (
    <div className={`flex flex-col bg-slate-950 text-white rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl overflow-hidden ${className}`}>
      
      {/* 1. Header Compact & Minimaliste */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm text-white block leading-tight">{layout.name}</span>
            <span className="text-[11px] text-emerald-400 font-bold">
              {availableSeatsCount} place{availableSeatsCount > 1 ? 's' : ''} disponible{availableSeatsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Multi-deck selector if 2 decks */}
          {layout.decksCount === 2 && (
            <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveDeck(1)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  activeDeck === 1 ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Niveau 1
              </button>
              <button
                type="button"
                onClick={() => setActiveDeck(2)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  activeDeck === 2 ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Niveau 2
              </button>
            </div>
          )}

          {/* Perspective View Switcher: Plan 2D or 3D Confort */}
          <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setViewPerspective('topdown')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewPerspective === 'topdown' ? 'bg-orange-500 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Plan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective('perspective3d')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                viewPerspective === 'perspective3d' ? 'bg-orange-500 text-white font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>3D</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bandeau d'information contextuel au clic / sélection */}
      {activeInfoSeat && (
        <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
          {(() => {
            const { state, isMyLock, lockTimeRemaining } = getSeatEffectiveState(activeInfoSeat);
            const isSel = state === 'SELECTED';
            const isOcc = state === 'OCCUPIED';
            const isLoc = state === 'LOCKED';
            const seatPrice = pricePerSeat + (activeInfoSeat.priceModifier || 0);

            return (
              <>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs ${
                    isSel 
                      ? 'bg-orange-500 text-white' 
                      : isOcc 
                      ? 'bg-slate-800 text-slate-500' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    Siège #{activeInfoSeat.seatNumber}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {isSel 
                      ? 'Place sélectionnée' 
                      : isOcc 
                      ? 'Déjà occupée' 
                      : isLoc 
                      ? (isMyLock ? 'Réservée pour vous' : 'En cours de réservation') 
                      : 'Disponible'}
                    {activeInfoSeat.category === 'PMR' && ' • Accès PMR'}
                    {activeInfoSeat.category === 'VIP' && ' • Fauteuil VIP'}
                  </span>
                </div>
                <div className="text-orange-400 font-bold font-mono">
                  {seatPrice.toLocaleString()} FCFA
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* 3. Stage du Véhicule : Ultra Compact, Épuré et Lisible */}
      <div className="relative w-full py-4 px-2 sm:px-6 flex items-center justify-center bg-slate-950 select-none">
        
        {/* Transform Viewport */}
        <div 
          className="relative transition-all duration-300 w-full max-w-[340px]"
          style={
            viewPerspective === 'perspective3d'
              ? { transform: 'perspective(800px) rotateX(16deg)', transformOrigin: 'top center' }
              : {}
          }
        >
          {/* Silhouette du Véhicule Compacte */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-3 sm:p-4 shadow-lg">
            
            {/* Avant du Car (Cabine & Portière) : sobre & compact */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 text-[10px] text-slate-400 font-semibold px-1">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-xs">🛞</span>
                <span>Chauffeur</span>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                Entrée Avant
              </div>
            </div>

            {/* Grille des Sièges */}
            <div className="space-y-1.5 sm:space-y-2">
              {Array.from({ length: deckRows }, (_, rowIdx) => {
                const rowNum = rowIdx + 1;
                const rowSeats = currentDeckSeats.filter(s => s.row === rowNum);
                if (rowSeats.length === 0) return null;

                const leftSeats = rowSeats.filter(s => s.col < layout.aisleColumnIndex);
                const rightSeats = rowSeats.filter(s => s.col >= layout.aisleColumnIndex);

                return (
                  <div key={`row-${rowNum}`} className="flex items-center justify-between gap-1">
                    
                    {/* Sièges Côté Gauche */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {leftSeats.map(seat => renderCompactSeat(seat))}
                    </div>

                    {/* Allée Centrale (Couloir fin) */}
                    <div className="w-5 sm:w-6 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-slate-800/80 rounded-full" />
                    </div>

                    {/* Sièges Côté Droit */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {rightSeats.map(seat => renderCompactSeat(seat))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrière du Car : compact et discret */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between px-1 text-[10px] text-slate-500 font-medium">
              <span>Arrière du car</span>
              {layout.features.hasToilet && <span>Toilettes 🚻</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Légende Compacte & Synthèse des Places Retenues */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Légende en 1 ligne épurée */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-emerald-400/70" />
            <span className="text-slate-300 font-semibold">Libre</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 shadow-sm" />
            <span className="text-orange-400 font-bold">Sélectionné</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800 opacity-60" />
            <span className="text-slate-500 font-medium">Occupé</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-900/60 border border-amber-500/50" />
            <span className="text-amber-400 font-medium">En réservation</span>
          </div>
        </div>

        {/* Compteur des places sélectionnées */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-semibold">
            Vos places ({selectedSeats.length}/{maxSelectable}) :
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-orange-400 font-mono">
            {selectedSeats.length > 0 ? selectedSeats.map(s => `#${s}`).join(', ') : 'Aucune'}
          </span>
        </div>
      </div>
    </div>
  );

  /**
   * Rendu compact et ergonomique d'un siège individuel
   */
  function renderCompactSeat(seat: SeatItem) {
    const { state, isMyLock, lockTimeRemaining } = getSeatEffectiveState(seat);
    const isSelected = state === 'SELECTED';
    const isOccupied = state === 'OCCUPIED';
    const isLocked = state === 'LOCKED';
    const isBlocked = state === 'BLOCKED';
    const isPmr = state === 'PMR' || seat.category === 'PMR';
    const isVip = state === 'VIP' || seat.category === 'VIP';

    const isClickable = !readOnly && !isOccupied && !isBlocked && (!isLocked || isMyLock);

    // Dynamic styling
    let seatStyle = 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-emerald-500/40 hover:border-emerald-400 active:scale-95';
    
    if (isSelected) {
      seatStyle = 'bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black border-2 border-white shadow-md shadow-orange-500/40 scale-105 ring-1 ring-orange-300';
    } else if (isLocked) {
      seatStyle = 'bg-amber-950/60 text-amber-300 border border-amber-500/50 cursor-not-allowed opacity-80';
    } else if (isOccupied) {
      seatStyle = 'bg-slate-900/70 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-40';
    } else if (isBlocked) {
      seatStyle = 'bg-slate-950 text-red-700 border border-red-900/40 cursor-not-allowed opacity-40';
    } else if (isPmr) {
      seatStyle = 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-500/60';
    } else if (isVip) {
      seatStyle = 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-500/60';
    }

    return (
      <button
        key={seat.id}
        id={`seat-${seat.seatNumber}`}
        type="button"
        disabled={!isClickable}
        onClick={() => handleSeatTap(seat)}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 ${seatStyle} ${
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
        title={`Siège #${seat.seatNumber}`}
      >
        {/* Numéro du Siège Net et Parfaitement Lisible */}
        <span className="font-mono font-black text-xs sm:text-[13px] leading-none">
          {seat.seatNumber}
        </span>

        {/* Mini badge discret pour VIP ou PMR */}
        {isVip && !isSelected && (
          <Crown className="w-2 h-2 text-amber-400 absolute top-0.5 right-0.5" />
        )}
        {isPmr && !isSelected && (
          <Accessibility className="w-2 h-2 text-purple-400 absolute top-0.5 right-0.5" />
        )}
        {isSelected && (
          <Check className="w-2.5 h-2.5 text-white absolute bottom-0.5 right-0.5 stroke-[3]" />
        )}
        {isLocked && !isSelected && (
          <Lock className="w-2 h-2 text-amber-300 absolute top-0.5 right-0.5" />
        )}
      </button>
    );
  }
};
