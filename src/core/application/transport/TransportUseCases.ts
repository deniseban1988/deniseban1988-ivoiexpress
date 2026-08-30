import { ITransportUseCase, ITransportRepository, CreateAgencyParams } from '../../ports/transport.ports';
import { IPaymentGatewayPort, IAuditLoggerPort } from '../../ports/transversal.ports';
import { IAuthRepository } from '../../ports/auth.ports';
import { TransportDomain } from '../../domain/transport/TransportDomain';
import { TransversalDomain } from '../../domain/transversal/TransversalDomain';
import { BusTrip, TicketBooking, PaymentMethod, UserRole, TransportAgency, UserAccount, Vehicle, Driver } from '../../../types';

export class TransportUseCases implements ITransportUseCase {
  constructor(
    private repository: ITransportRepository,
    private paymentGateway: IPaymentGatewayPort,
    private auditLogger: IAuditLoggerPort,
    private authRepository?: IAuthRepository
  ) {}

  async searchTrips(departureCity: string, arrivalCity: string, date?: string): Promise<BusTrip[]> {
    const validation = TransportDomain.validateSearchCriteria(departureCity, arrivalCity);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return this.repository.getTrips(departureCity, arrivalCity, date);
  }

  async reserveSeat(
    tripId: string,
    seatNumber: number,
    passengerName: string,
    passengerPhone: string,
    paymentMethod: PaymentMethod,
    userRole: UserRole
  ): Promise<TicketBooking> {
    const trip = await this.repository.getTripById(tripId);
    if (!trip) {
      throw new Error("Trajet d'autocar introuvable.");
    }

    const seatValidation = TransportDomain.validateSeatBooking(trip, seatNumber);
    if (!seatValidation.valid) {
      throw new Error(seatValidation.error);
    }

    // Process payment via Transversal Payment Adapter
    const payResult = await this.paymentGateway.processPayment(
      'Transport',
      trip.price,
      paymentMethod,
      passengerName,
      passengerPhone
    );

    if (!payResult.success) {
      throw new Error(`Paiement échoué: ${payResult.message}`);
    }

    const digitalSignature = TransportDomain.generateTicketSignature(trip.id, seatNumber, passengerPhone);

    const bookingPayload: Partial<TicketBooking> = {
      ticketCode: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      passengerName,
      passengerPhone,
      seatNumber,
      busTripId: trip.id,
      agencyId: trip.agencyId,
      agencyName: trip.agencyName,
      departureCity: trip.departureCity,
      arrivalCity: trip.arrivalCity,
      departureStation: trip.departureStation,
      arrivalStation: trip.arrivalStation,
      date: trip.date,
      departureTime: trip.departureTime,
      price: trip.price,
      paymentMethod,
      paymentReference: payResult.reference,
      paymentStatus: 'Payé',
      ticketStatus: 'Valide',
      digitalSignature,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      qrCodeData: `TKT|${trip.id}|${seatNumber}|${passengerPhone}|${digitalSignature}`
    };

    const booking = await this.repository.bookTicket(bookingPayload);

    // Write immutable financial audit log
    await this.auditLogger.logAction(
      passengerName,
      userRole,
      'RÉSERVATION_BILLET_AUTOCAR',
      'Transport',
      `Billet #${booking.ticketCode} réservé (${trip.departureCity} -> ${trip.arrivalCity}, Siège N°${seatNumber}, ${trip.price} FCFA via ${paymentMethod}).`,
      'Succès'
    );

    return booking;
  }

  async getAgencyDashboardData(agencyId: string, userRole: UserRole) {
    if (!TransversalDomain.hasPermission(userRole, 'Transport', 'READ')) {
      throw new Error("Accès refusé. Droits d'administration Transport insuffisants.");
    }

    const [bookings, vehicles, drivers] = await Promise.all([
      this.repository.getAgencyBookings(agencyId),
      this.repository.getAgencyVehicles(agencyId),
      this.repository.getAgencyDrivers(agencyId)
    ]);

    return { bookings, vehicles, drivers };
  }

  async createAgencyTransaction(params: CreateAgencyParams): Promise<{ agency: TransportAgency; adminUser: UserAccount; vehicles: Vehicle[]; drivers: Driver[] }> {
    // 1. RBAC Check
    if (params.createdByRole !== 'SUPER_ADMIN' && params.createdByRole !== 'ADMIN_AGENCE') {
      throw new Error("Droits insuffisants pour créer une agence de transport. Rôle Super Admin requis.");
    }

    // 2. Strict Input Validations
    if (!params.name || !params.name.trim()) {
      throw new Error("Le nom de l'agence de transport est obligatoire.");
    }
    if (!params.code || !params.code.trim()) {
      throw new Error("Le code unique de l'agence est obligatoire.");
    }
    if (!params.adminFullName || !params.adminFullName.trim()) {
      throw new Error("Le nom de l'administrateur de l'agence est obligatoire.");
    }
    if (!params.adminEmail || !params.adminEmail.trim()) {
      throw new Error("L'adresse email de l'administrateur de l'agence est obligatoire.");
    }

    const agencyId = `ag-${params.code.trim().toLowerCase()}-${Date.now()}`;
    const defaultLogo = params.logoUrl || 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&auto=format&fit=crop&q=80';

    try {
      // Step A: Instantiate Agency entity with default settings
      const newAgencyData: Partial<TransportAgency> = {
        id: agencyId,
        name: params.name.trim(),
        code: params.code.trim().toUpperCase(),
        phone: params.phone || '+225 07 00 00 00 00',
        email: params.email || params.adminEmail,
        status: 'Actif',
        activeBuses: 12,
        totalDrivers: 8,
        rating: 4.9,
        logoUrl: defaultLogo
      };

      const createdAgency = await this.repository.createAgency(newAgencyData);

      // Step B: Automatically Create Admin Agence account
      const adminUserPayload: Partial<UserAccount> = {
        id: `user-admin-agency-${Date.now()}`,
        fullName: params.adminFullName.trim(),
        email: params.adminEmail.trim(),
        phone: params.adminPhone || params.phone || '+225 07 00 00 00 00',
        role: 'ADMIN_AGENCE',
        status: 'Actif',
        agencyId: createdAgency.id,
        agencyName: createdAgency.name,
        failedLoginAttempts: 0,
        isLocked: false,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };

      let adminUser: UserAccount;
      if (this.authRepository) {
        adminUser = await this.authRepository.createUser(adminUserPayload);
      } else {
        adminUser = adminUserPayload as UserAccount;
      }

      // Step C: Link Agency and Admin
      createdAgency.adminUserId = adminUser.id;
      createdAgency.adminEmail = adminUser.email;
      await this.repository.updateAgency(createdAgency);

      // Step D: Initialize Default Workspaces / Vehicles & Drivers for the Agency
      const vehicle1 = await this.repository.createVehicle({
        agencyId: createdAgency.id,
        immatriculation: `CI-${Math.floor(1000 + Math.random() * 9000)}-${createdAgency.code}`,
        brand: 'Scania',
        model: 'Touring VIP 2025',
        type: 'VIP Climatisé',
        capacity: 54,
        hasAC: true,
        hasWifi: true,
        hasUSB: true,
        status: 'En service',
        lastInspectionDate: new Date().toISOString().substring(0, 10),
        maintenanceHistory: []
      });

      const vehicle2 = await this.repository.createVehicle({
        agencyId: createdAgency.id,
        immatriculation: `CI-${Math.floor(1000 + Math.random() * 9000)}-${createdAgency.code}`,
        brand: 'Volvo',
        model: '9700 Grand Luxe',
        type: 'Luxe Climatisé',
        capacity: 48,
        hasAC: true,
        hasWifi: true,
        hasUSB: true,
        status: 'En service',
        lastInspectionDate: new Date().toISOString().substring(0, 10),
        maintenanceHistory: []
      });

      const driver1 = await this.repository.createDriver({
        agencyId: createdAgency.id,
        fullName: 'Kouassi Yves-Marc',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+225 07 11 22 33 44',
        licenseNumber: `PERMIS-D-${createdAgency.code}-001`,
        licenseExpirationDate: '2028-12-31',
        experienceYears: 12,
        status: 'En trajet',
        missionHistory: []
      });

      const vehicles = [vehicle1, vehicle2];
      const drivers = [driver1];

      // Step E: Audit Log
      await this.auditLogger.logAction(
        params.adminEmail,
        params.createdByRole,
        'CRÉATION_AGENCE_TRANSPORT',
        'Transport',
        `Création de l'agence "${createdAgency.name}" (${createdAgency.code}) et compte Admin Agence ${adminUser.fullName} (${adminUser.email}) activé.`,
        'Succès'
      );

      return { agency: createdAgency, adminUser, vehicles, drivers };
    } catch (err: any) {
      await this.auditLogger.logAction(
        params.adminEmail || 'Inconnu',
        params.createdByRole,
        'ÉCHEC_CRÉATION_AGENCE_TRANSPORT',
        'Transport',
        `Erreur lors de la création d'agence: ${err.message}`,
        'Refusé'
      );
      throw new Error(`Transaction de création d'agence échouée : ${err.message}`);
    }
  }
}

