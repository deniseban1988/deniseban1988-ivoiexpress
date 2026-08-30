import React from 'react';
import { BusTrip, TicketBooking, UserAccount } from '../../types';
import { NewTransportBookingFlow } from './NewTransportBookingFlow';

interface TransportBookingProps {
  trips: BusTrip[];
  onBookTicket: (newBooking: TicketBooking) => void;
  myBookings: TicketBooking[];
  currentUser?: UserAccount | null;
  onBookingStepChange?: (step: number | null) => void;
  onOpenMyTickets?: () => void;
}

export const TransportBooking: React.FC<TransportBookingProps> = ({
  trips,
  onBookTicket,
  myBookings,
  currentUser,
  onBookingStepChange,
  onOpenMyTickets
}) => {
  const handleBookMultipleTickets = (bookings: TicketBooking[]) => {
    bookings.forEach(b => {
      onBookTicket(b);
    });
  };

  return (
    <div className="space-y-6">
      {/* Parcours Voyageur Réservation de Billets & Choix de Siège */}
      <NewTransportBookingFlow
        trips={trips}
        onBookTickets={handleBookMultipleTickets}
        myBookings={myBookings}
        currentUser={currentUser}
        onBookingStepChange={onBookingStepChange}
        onOpenMyTickets={onOpenMyTickets}
      />
    </div>
  );
};
