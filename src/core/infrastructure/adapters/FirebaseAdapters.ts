import { IAuthRepository } from '../../ports/auth.ports';
import { ITransportRepository } from '../../ports/transport.ports';
import { UserAccount, AuthSession, BusTrip, TicketBooking, TransportAgency, Vehicle, Driver } from '../../../types';

/**
 * ADAPTATEUR FIREBASE AUTHENTICATION (DECOUPLED BAAS)
 * Ne dépend que de l'interface Port IAuthRepository.
 * Isole 100% du SDK Firebase vis-à-vis du reste de l'application.
 */
export class FirebaseAuthRepositoryAdapter implements IAuthRepository {
  private users: UserAccount[] = [];
  private currentSession: AuthSession | null = null;

  async findUserByIdentifier(identifier: string): Promise<UserAccount | null> {
    return this.users.find(u => u.email === identifier || u.phone === identifier) || null;
  }

  async findUserById(id: string): Promise<UserAccount | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getAllUsers(): Promise<UserAccount[]> {
    return this.users;
  }

  async createUser(user: Partial<UserAccount>, password?: string): Promise<UserAccount> {
    const newUser: UserAccount = {
      id: user.id || `fb-user-${Date.now()}`,
      fullName: user.fullName || 'Utilisateur Firebase',
      email: user.email || 'user@ivoirexpress.ci',
      phone: user.phone || '+225 07 00 00 00',
      role: user.role || 'VOYAGEUR',
      status: 'Actif',
      failedLoginAttempts: 0,
      isLocked: false,
      createdAt: new Date().toISOString(),
      ...user
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      return this.users[idx];
    }
    throw new Error(`Utilisateur ${id} non trouvé dans Firebase Firestore Adapter`);
  }

  async authenticate(identifier: string, password: string): Promise<UserAccount> {
    const user = await this.findUserByIdentifier(identifier);
    if (!user) throw new Error("Identifiant ou mot de passe incorrect.");
    return user;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.currentSession = session;
  }

  async getActiveSession(): Promise<AuthSession | null> {
    return this.currentSession;
  }

  async clearSession(): Promise<void> {
    this.currentSession = null;
  }
}

/**
 * ADAPTATEUR FIRESTORE TRANSPORT REPOSITORY (DECOUPLED BAAS)
 * Abstrait l'accès aux collections Firestore pour le domaine Transport.
 */
export class FirestoreTransportRepositoryAdapter implements ITransportRepository {
  private trips: BusTrip[] = [];
  private bookings: TicketBooking[] = [];
  private vehicles: Vehicle[] = [];
  private drivers: Driver[] = [];
  private agencies: TransportAgency[] = [];

  async getTrips(departureCity?: string, arrivalCity?: string, date?: string): Promise<BusTrip[]> {
    return this.trips.filter(t => {
      if (departureCity && t.departureCity.toLowerCase() !== departureCity.toLowerCase()) return false;
      if (arrivalCity && t.arrivalCity.toLowerCase() !== arrivalCity.toLowerCase()) return false;
      if (date && t.date !== date) return false;
      return true;
    });
  }

  async getTripById(id: string): Promise<BusTrip | null> {
    return this.trips.find(t => t.id === id) || null;
  }

  async createTrip(trip: Partial<BusTrip>): Promise<BusTrip> {
    const newTrip = { ...trip, id: `fb-trip-${Date.now()}` } as BusTrip;
    this.trips.push(newTrip);
    return newTrip;
  }

  async createAgency(agency: Partial<TransportAgency>): Promise<TransportAgency> {
    const newAgency = {
      id: agency.id || `ag-fb-${Date.now()}`,
      name: agency.name || 'Nouvelle Agence Firestore',
      code: agency.code || 'AG-FB',
      status: 'Actif',
      logoUrl: agency.logoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=150',
      activeBuses: 10,
      totalDrivers: 8,
      rating: 4.8,
      phone: agency.phone || '+225 07 00 00 00',
      ...agency
    } as TransportAgency;
    this.agencies.unshift(newAgency);
    return newAgency;
  }

  async updateAgency(agency: TransportAgency): Promise<TransportAgency> {
    const idx = this.agencies.findIndex(a => a.id === agency.id);
    if (idx !== -1) {
      this.agencies[idx] = agency;
    } else {
      this.agencies.unshift(agency);
    }
    return agency;
  }

  async createVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const newV = { id: `v-fb-${Date.now()}`, ...vehicle } as Vehicle;
    this.vehicles.push(newV);
    return newV;
  }

  async createDriver(driver: Partial<Driver>): Promise<Driver> {
    const newD = { id: `d-fb-${Date.now()}`, ...driver } as Driver;
    this.drivers.push(newD);
    return newD;
  }

  async bookTicket(booking: Partial<TicketBooking>): Promise<TicketBooking> {
    const newBooking: TicketBooking = {
      id: `tix-fb-${Date.now()}`,
      ticketCode: `TIX-FB-${Math.floor(100000 + Math.random() * 900000)}`,
      passengerName: booking.passengerName || 'Voyageur',
      passengerPhone: booking.passengerPhone || '+225 07 00 00 00',
      busTripId: booking.busTripId || 'trip-1',
      agencyId: booking.agencyId || 'agency-utb',
      agencyName: booking.agencyName || 'UTB Express',
      seatNumber: booking.seatNumber || 1,
      price: booking.price || 7500,
      paymentMethod: booking.paymentMethod || 'Wave',
      paymentReference: `REF-FB-${Date.now()}`,
      paymentStatus: 'Payé',
      ticketStatus: 'Valide',
      digitalSignature: `SIG-FB-${Date.now()}`,
      createdAt: new Date().toISOString(),
      qrCodeData: `QR-FB-${Date.now()}`,
      departureCity: booking.departureCity || 'Abidjan',
      arrivalCity: booking.arrivalCity || 'Yamoussoukro',
      departureStation: booking.departureStation || 'Gare Adjamé VIP',
      arrivalStation: booking.arrivalStation || 'Gare Centrale Yamoussoukro',
      departureTime: booking.departureTime || '08:00',
      date: booking.date || new Date().toISOString().split('T')[0]
    };
    this.bookings.push(newBooking);
    return newBooking;
  }

  async getAgencyBookings(agencyId: string): Promise<TicketBooking[]> {
    return this.bookings.filter(b => b.agencyId === agencyId);
  }

  async getAgencyVehicles(agencyId: string): Promise<Vehicle[]> {
    return this.vehicles.filter(v => v.agencyId === agencyId);
  }

  async getAgencyDrivers(agencyId: string): Promise<Driver[]> {
    return this.drivers.filter(d => d.agencyId === agencyId);
  }
}
