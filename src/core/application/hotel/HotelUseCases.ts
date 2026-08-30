import { IHotelUseCase, IHotelRepository, CreateHotelParams } from '../../ports/hotel.ports';
import { IPaymentGatewayPort, IAuditLoggerPort } from '../../ports/transversal.ports';
import { IAuthRepository } from '../../ports/auth.ports';
import { HotelDomain } from '../../domain/hotel/HotelDomain';
import { TransversalDomain } from '../../domain/transversal/TransversalDomain';
import { Hotel, HotelRoom, HotelBooking, PaymentMethod, UserRole, UserAccount } from '../../../types';

export class HotelUseCases implements IHotelUseCase {
  constructor(
    private repository: IHotelRepository,
    private paymentGateway: IPaymentGatewayPort,
    private auditLogger: IAuditLoggerPort,
    private authRepository?: IAuthRepository
  ) {}

  async searchAccommodations(city?: string, region?: string): Promise<Hotel[]> {
    return this.repository.getHotels(city, region);
  }

  async getHotelDetails(hotelId: string) {
    const hotel = await this.repository.getHotelById(hotelId);
    if (!hotel) return null;
    const rooms = await this.repository.getRoomsByHotelId(hotelId);
    return { hotel, rooms };
  }

  async bookRoom(
    hotelId: string,
    roomId: string,
    guestName: string,
    guestPhone: string,
    checkIn: string,
    checkOut: string,
    paymentMethod: PaymentMethod,
    userRole: UserRole
  ): Promise<HotelBooking> {
    const details = await this.getHotelDetails(hotelId);
    if (!details) {
      throw new Error("Établissement hôtelier introuvable.");
    }

    const room = details.rooms.find(r => r.id === roomId);
    if (!room) {
      throw new Error("Chambre introuvable.");
    }

    const validation = HotelDomain.validateHotelBooking(details.hotel, room, 1);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const totalPrice = HotelDomain.calculateStayTotal(room.pricePerNight, checkIn, checkOut);

    // Transversal payment
    const payResult = await this.paymentGateway.processPayment(
      'Hôtellerie',
      totalPrice,
      paymentMethod,
      guestName,
      guestPhone
    );

    if (!payResult.success) {
      throw new Error(`Paiement échoué: ${payResult.message}`);
    }

    const bookingCode = `RES-HOT-CI-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrCodeData = HotelDomain.generateBookingQrPayload(bookingCode, hotelId, guestPhone);

    const bookingPayload: Partial<HotelBooking> = {
      bookingCode,
      hotelId: details.hotel.id,
      hotelName: details.hotel.name,
      hotelCity: details.hotel.city,
      hotelAddress: details.hotel.address,
      roomId: room.id,
      roomType: room.type,
      guestName,
      guestPhone,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nightsCount: 1,
      guestsCount: 1,
      totalPrice,
      paymentMethod,
      paymentReference: payResult.reference,
      paymentStatus: 'Payé',
      status: 'Confirmé',
      qrCodeData,
      digitalSignature: `SIG-HOTEL-${btoa(bookingCode).substring(0, 16)}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const booking = await this.repository.createHotelBooking(bookingPayload);

    await this.auditLogger.logAction(
      guestName,
      userRole,
      'RÉSERVATION_CHAMBRE_HÔTEL',
      'Hôtellerie',
      `Réservation #${booking.bookingCode} confirmée (${details.hotel.name}, ${room.name}, ${totalPrice} FCFA via ${paymentMethod}).`,
      'Succès'
    );

    return booking;
  }

  async getHotelManagementData(hotelId: string, userRole: UserRole) {
    if (!TransversalDomain.hasPermission(userRole, 'Hôtellerie', 'READ')) {
      throw new Error("Accès refusé aux données de gestion hôtelière.");
    }

    const [bookings, rooms] = await Promise.all([
      this.repository.getHotelBookings(hotelId),
      this.repository.getRoomsByHotelId(hotelId)
    ]);

    return { bookings, rooms };
  }

  async createHotelTransaction(params: CreateHotelParams): Promise<{ hotel: Hotel; adminUser: UserAccount; rooms: HotelRoom[] }> {
    // 1. RBAC Check
    if (params.createdByRole !== 'SUPER_ADMIN' && params.createdByRole !== 'ADMIN_HOTEL') {
      throw new Error("Droits insuffisants pour créer un établissement hôtelier. Rôle Super Admin ou Admin Hôtel requis.");
    }

    // 2. Strict Input Validations
    if (!params.name || !params.name.trim()) {
      throw new Error("Le nom de l'établissement hôtelier est obligatoire.");
    }
    if (!params.city || !params.city.trim()) {
      throw new Error("La ville de l'établissement est obligatoire.");
    }
    if (!params.address || !params.address.trim()) {
      throw new Error("L'adresse de l'établissement est obligatoire.");
    }
    if (!params.adminFullName || !params.adminFullName.trim()) {
      throw new Error("Le nom de l'administrateur de l'hôtel est obligatoire.");
    }
    if (!params.adminEmail || !params.adminEmail.trim()) {
      throw new Error("L'adresse email de l'administrateur de l'hôtel est obligatoire.");
    }

    const hotelId = `hotel-${Date.now()}`;
    const defaultImage = params.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80';

    try {
      // Step A: Instantiate Hotel with default configuration
      const newHotelData: Partial<Hotel> = {
        id: hotelId,
        name: params.name.trim(),
        type: params.type || 'Hôtel',
        stars: params.stars || 4,
        region: params.region || 'Lagunes',
        city: params.city.trim(),
        commune: params.commune || 'Cocody',
        address: params.address.trim(),
        contactPhone: params.phone || '+225 07 00 00 00 00',
        email: params.email || params.adminEmail,
        description: params.description || `Établissement hôtelier certifié à ${params.city}, Côte d'Ivoire.`,
        pricePerNight: params.pricePerNight || 45000,
        imageUrl: defaultImage,
        gallery: [defaultImage, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&auto=format&fit=crop&q=80'],
        country: "Côte d'Ivoire",
        rating: 5.0,
        totalRooms: 10,
        amenities: ['Wi-Fi Haut Débit', 'Climatisation', 'Télévision HD', 'Restaurant', 'Piscine', 'Parking Sécurisé'],
        receptionHours: '24h/24 & 7j/7',
        cancellationPolicy: "Annulation gratuite jusqu'à 24h avant l'arrivée",
        status: 'Actif'
      };

      const createdHotel = await this.repository.createHotel(newHotelData);

      // Step B: Automatically Create Admin Hôtel account
      const adminUserPayload: Partial<UserAccount> = {
        id: `user-admin-hotel-${Date.now()}`,
        fullName: params.adminFullName.trim(),
        email: params.adminEmail.trim(),
        phone: params.adminPhone || params.phone || '+225 07 00 00 00 00',
        role: 'ADMIN_HOTEL',
        status: 'Actif',
        hotelId: createdHotel.id,
        hotelName: createdHotel.name,
        failedLoginAttempts: 0,
        isLocked: false,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };

      let adminUser: UserAccount;
      if (this.authRepository) {
        adminUser = await this.authRepository.createUser(adminUserPayload);
      } else {
        adminUser = adminUserPayload as UserAccount;
      }

      // Step C: Link Hotel and Admin
      createdHotel.adminUserId = adminUser.id;
      createdHotel.adminEmail = adminUser.email;
      await this.repository.updateHotel(createdHotel);

      // Step D: Initialize Default Rooms for the Hotel
      const room1 = await this.repository.createRoom({
        hotelId: createdHotel.id,
        roomNumber: '101',
        name: 'Chambre Deluxe Vue Jardin',
        type: 'Deluxe King',
        description: 'Chambre spacieuse équipée de tous les conforts modernes.',
        pricePerNight: params.pricePerNight || 45000,
        maxCapacity: 2,
        bedCount: 1,
        bedType: '1 Lit King Size',
        isAvailable: true,
        features: ['Wi-Fi', 'Climatisation', 'Télévision HD', 'Coffre-Fort'],
        imageUrl: defaultImage
      });

      const room2 = await this.repository.createRoom({
        hotelId: createdHotel.id,
        roomNumber: '201',
        name: 'Suite Executive Royale',
        type: 'Suite Executive',
        description: 'Suite luxueuse avec salon privé, vue panoramique et jacuzzi.',
        pricePerNight: Math.round((params.pricePerNight || 45000) * 1.8),
        maxCapacity: 3,
        bedCount: 1,
        bedType: '1 Lit King Size + Canapé Lit',
        isAvailable: true,
        features: ['Wi-Fi VIP', 'Climatisation', 'Jacuzzi', 'Mini-Bar', 'Balcon Privé'],
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&auto=format&fit=crop&q=80'
      });

      const rooms = [room1, room2];

      // Step E: Audit Log
      await this.auditLogger.logAction(
        params.adminEmail,
        params.createdByRole,
        'CRÉATION_ÉTABLISSEMENT_HÔTEL',
        'Hôtellerie',
        `Création de l'hôtel "${createdHotel.name}" (${createdHotel.city}) et compte Admin Hôtel ${adminUser.fullName} (${adminUser.email}) activé.`,
        'Succès'
      );

      return { hotel: createdHotel, adminUser, rooms };
    } catch (err: any) {
      await this.auditLogger.logAction(
        params.adminEmail || 'Inconnu',
        params.createdByRole,
        'ÉCHEC_CRÉATION_ÉTABLISSEMENT_HÔTEL',
        'Hôtellerie',
        `Erreur lors de la création d'hôtel: ${err.message}`,
        'Refusé'
      );
      throw new Error(`Transaction de création d'hôtel échouée : ${err.message}`);
    }
  }
}
