import { BusTrip, TicketBooking, TransportAgency, Vehicle, Driver, PaymentMethod, UserRole, UserAccount } from '../../types';

export interface CreateAgencyParams {
  name: string;
  code: string;
  region?: string;
  city?: string;
  address?: string;
  phone: string;
  email: string;
  description?: string;
  logoUrl?: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  createdById: string;
  createdByRole: UserRole;
}

// Output Port (Secondary Port) - Database / External Repository Interface
export interface ITransportRepository {
  getTrips(departureCity?: string, arrivalCity?: string, date?: string): Promise<BusTrip[]>;
  getTripById(id: string): Promise<BusTrip | null>;
  createTrip(trip: Partial<BusTrip>): Promise<BusTrip>;
  createAgency(agency: Partial<TransportAgency>): Promise<TransportAgency>;
  updateAgency(agency: TransportAgency): Promise<TransportAgency>;
  createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle>;
  createDriver(driver: Partial<Driver>): Promise<Driver>;
  bookTicket(booking: Partial<TicketBooking>): Promise<TicketBooking>;
  getAgencyBookings(agencyId: string): Promise<TicketBooking[]>;
  getAgencyVehicles(agencyId: string): Promise<Vehicle[]>;
  getAgencyDrivers(agencyId: string): Promise<Driver[]>;
}

// Input Port (Primary Port) - Application Use Cases Interface
export interface ITransportUseCase {
  searchTrips(departureCity: string, arrivalCity: string, date?: string): Promise<BusTrip[]>;
  reserveSeat(tripId: string, seatNumber: number, passengerName: string, passengerPhone: string, paymentMethod: PaymentMethod, userRole: UserRole): Promise<TicketBooking>;
  getAgencyDashboardData(agencyId: string, userRole: UserRole): Promise<{ bookings: TicketBooking[]; vehicles: Vehicle[]; drivers: Driver[] }>;
  createAgencyTransaction(params: CreateAgencyParams): Promise<{ agency: TransportAgency; adminUser: UserAccount; vehicles: Vehicle[]; drivers: Driver[] }>;
}
