import { Hotel, HotelRoom, HotelBooking, PaymentMethod } from '../../../types';

export class HotelDomain {
  /**
   * Calculate total stay cost in FCFA
   */
  static calculateStayTotal(pricePerNight: number, checkIn: string, checkOut: string, roomsCount: number = 1): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return pricePerNight * nights * roomsCount;
  }

  /**
   * Validate hotel booking parameters
   */
  static validateHotelBooking(hotel: Hotel, room: HotelRoom, guestsCount: number): { valid: boolean; error?: string } {
    if (!room.isAvailable) {
      return { valid: false, error: "Cette chambre n'est plus disponible pour les dates sélectionnées." };
    }
    if (guestsCount > room.maxCapacity) {
      return { valid: false, error: `Cette chambre accepte un maximum de ${room.maxCapacity} personnes.` };
    }
    return { valid: true };
  }

  /**
   * Generate secure QR Code data payload
   */
  static generateBookingQrPayload(bookingCode: string, hotelId: string, guestPhone: string): string {
    return JSON.stringify({
      code: bookingCode,
      hotel: hotelId,
      phone: guestPhone,
      ts: Date.now(),
      v: "6.0"
    });
  }
}
