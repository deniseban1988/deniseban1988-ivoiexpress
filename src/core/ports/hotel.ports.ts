import { Hotel, HotelRoom, HotelBooking, PaymentMethod, UserRole, AccommodationType, UserAccount } from '../../types';

export interface CreateHotelParams {
  name: string;
  type: AccommodationType;
  stars: number;
  region: string;
  city: string;
  commune?: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  pricePerNight?: number;
  imageUrl?: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  createdById: string;
  createdByRole: UserRole;
}

export interface IHotelRepository {
  getHotels(city?: string, region?: string): Promise<Hotel[]>;
  getHotelById(id: string): Promise<Hotel | null>;
  getRoomsByHotelId(hotelId: string): Promise<HotelRoom[]>;
  createHotel(hotel: Partial<Hotel>): Promise<Hotel>;
  updateHotel(hotel: Hotel): Promise<Hotel>;
  createRoom(room: Partial<HotelRoom>): Promise<HotelRoom>;
  createHotelBooking(booking: Partial<HotelBooking>): Promise<HotelBooking>;
  getHotelBookings(hotelId: string): Promise<HotelBooking[]>;
}

export interface IHotelUseCase {
  searchAccommodations(city?: string, region?: string): Promise<Hotel[]>;
  getHotelDetails(hotelId: string): Promise<{ hotel: Hotel; rooms: HotelRoom[] } | null>;
  bookRoom(hotelId: string, roomId: string, guestName: string, guestPhone: string, checkIn: string, checkOut: string, paymentMethod: PaymentMethod, userRole: UserRole): Promise<HotelBooking>;
  getHotelManagementData(hotelId: string, userRole: UserRole): Promise<{ bookings: HotelBooking[]; rooms: HotelRoom[] }>;
  createHotelTransaction(params: CreateHotelParams): Promise<{ hotel: Hotel; adminUser: UserAccount; rooms: HotelRoom[] }>;
}
