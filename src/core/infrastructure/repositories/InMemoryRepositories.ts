import { ITransportRepository } from '../../ports/transport.ports';
import { IHotelRepository } from '../../ports/hotel.ports';
import { IVisionRepository } from '../../ports/vision.ports';
import { IIPTVRepository } from '../../ports/iptv.ports';
import { BusTrip, TicketBooking, Vehicle, Driver, TransportAgency, Hotel, HotelRoom, HotelBooking, Camera, VisionAlert, CameraRecording } from '../../../types';
import { IPTVContentItem, IPTVPlaylist } from '../../../types/iptv';
import { INITIAL_TRIPS, INITIAL_AGENCIES, INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_BOOKINGS, INITIAL_HOTELS, INITIAL_ROOMS, INITIAL_HOTEL_BOOKINGS, INITIAL_CAMERAS, INITIAL_VISION_ALERTS, INITIAL_RECORDINGS } from '../../../data/mockData';
import { INITIAL_IPTV_CONTENTS, INITIAL_IPTV_PLAYLISTS } from '../../../data/iptvMockData';

// Infrastructure Adapter: Transport Repository
export class TransportRepositoryAdapter implements ITransportRepository {
  private trips: BusTrip[] = [...INITIAL_TRIPS];
  private bookings: TicketBooking[] = [...INITIAL_BOOKINGS];
  private vehicles: Vehicle[] = [...INITIAL_VEHICLES];
  private drivers: Driver[] = [...INITIAL_DRIVERS];
  private agencies: TransportAgency[] = [...INITIAL_AGENCIES];

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

  async createTrip(tripData: Partial<BusTrip>): Promise<BusTrip> {
    const newTrip = { ...tripData, id: `trip-${Date.now()}` } as BusTrip;
    this.trips.push(newTrip);
    return newTrip;
  }

  async createAgency(agencyData: Partial<TransportAgency>): Promise<TransportAgency> {
    const newAgency = {
      id: agencyData.id || `ag-${Date.now()}`,
      status: 'Actif',
      logoUrl: agencyData.logoUrl || 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&auto=format&fit=crop&q=80',
      activeBuses: agencyData.activeBuses || 12,
      totalDrivers: agencyData.totalDrivers || 8,
      rating: agencyData.rating || 4.8,
      phone: agencyData.phone || '+225 07 00 00 00 00',
      ...agencyData
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

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const newVehicle = {
      id: vehicleData.id || `veh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'En route',
      speedKmH: 80,
      fuelPercent: 90,
      totalSeats: 54,
      ...vehicleData
    } as Vehicle;
    this.vehicles.unshift(newVehicle);
    return newVehicle;
  }

  async createDriver(driverData: Partial<Driver>): Promise<Driver> {
    const newDriver = {
      id: driverData.id || `drv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'En Service',
      rating: 4.9,
      completedTrips: 120,
      ...driverData
    } as Driver;
    this.drivers.unshift(newDriver);
    return newDriver;
  }

  async bookTicket(bookingData: Partial<TicketBooking>): Promise<TicketBooking> {
    const newBooking = { ...bookingData, id: `bkg-${Date.now()}` } as TicketBooking;
    this.bookings.push(newBooking);

    // Update seat occupancy on the trip
    const trip = this.trips.find(t => t.id === newBooking.busTripId);
    if (trip) {
      trip.availableSeats = Math.max(0, trip.availableSeats - 1);
      trip.occupiedSeats.push(newBooking.seatNumber);
    }

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


// Infrastructure Adapter: Hotel Repository
export class HotelRepositoryAdapter implements IHotelRepository {
  private hotels: Hotel[] = [...INITIAL_HOTELS];
  private rooms: HotelRoom[] = [...INITIAL_ROOMS];
  private bookings: HotelBooking[] = [...INITIAL_HOTEL_BOOKINGS];

  async getHotels(city?: string, region?: string): Promise<Hotel[]> {
    return this.hotels.filter(h => {
      if (city && h.city.toLowerCase() !== city.toLowerCase()) return false;
      if (region && h.region.toLowerCase() !== region.toLowerCase()) return false;
      return true;
    });
  }

  async getHotelById(id: string): Promise<Hotel | null> {
    return this.hotels.find(h => h.id === id) || null;
  }

  async getRoomsByHotelId(hotelId: string): Promise<HotelRoom[]> {
    return this.rooms.filter(r => r.hotelId === hotelId);
  }

  async createHotel(hotelData: Partial<Hotel>): Promise<Hotel> {
    const newHotel = {
      id: hotelData.id || `hotel-${Date.now()}`,
      status: 'Actif',
      gallery: hotelData.gallery || [hotelData.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80'],
      totalRooms: hotelData.totalRooms || 10,
      rating: hotelData.rating || 5.0,
      country: "Côte d'Ivoire",
      amenities: hotelData.amenities || ['Wi-Fi', 'Climatisation', 'Télévision', 'Restaurant', 'Piscine', 'Parking'],
      receptionHours: '24h/24 & 7j/7',
      cancellationPolicy: "Annulation gratuite jusqu'à 24h avant l'arrivée",
      ...hotelData
    } as Hotel;
    this.hotels.unshift(newHotel);
    return newHotel;
  }

  async updateHotel(hotel: Hotel): Promise<Hotel> {
    const idx = this.hotels.findIndex(h => h.id === hotel.id);
    if (idx !== -1) {
      this.hotels[idx] = hotel;
    } else {
      this.hotels.unshift(hotel);
    }
    return hotel;
  }

  async createRoom(roomData: Partial<HotelRoom>): Promise<HotelRoom> {
    const newRoom = {
      id: roomData.id || `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isAvailable: true,
      features: ['Wi-Fi', 'Climatisation', 'TV HD', 'Téléphone', 'Coffre-Fort'],
      ...roomData
    } as HotelRoom;
    this.rooms.unshift(newRoom);
    return newRoom;
  }

  async createHotelBooking(bookingData: Partial<HotelBooking>): Promise<HotelBooking> {
    const newBooking = { ...bookingData, id: `res-hot-${Date.now()}` } as HotelBooking;
    this.bookings.push(newBooking);
    return newBooking;
  }

  async getHotelBookings(hotelId: string): Promise<HotelBooking[]> {
    return this.bookings.filter(b => b.hotelId === hotelId);
  }
}

// Infrastructure Adapter: Vision Repository
export class VisionRepositoryAdapter implements IVisionRepository {
  private cameras: Camera[] = [...INITIAL_CAMERAS];
  private alerts: VisionAlert[] = [...INITIAL_VISION_ALERTS];
  private recordings: CameraRecording[] = [...INITIAL_RECORDINGS];

  async getCameras(ownerId?: string): Promise<Camera[]> {
    if (!ownerId) return this.cameras;
    return this.cameras.filter(c => c.agencyId === ownerId || c.ownerId === ownerId);
  }

  async getAlerts(agencyId?: string): Promise<VisionAlert[]> {
    if (!agencyId) return this.alerts;
    return this.alerts.filter(a => a.agencyId === agencyId);
  }

  async getRecordings(cameraId?: string): Promise<CameraRecording[]> {
    if (!cameraId) return this.recordings;
    return this.recordings.filter(r => r.cameraId === cameraId);
  }

  async addCamera(cameraData: Partial<Camera>): Promise<Camera> {
    const newCam = { ...cameraData, id: `cam-${Date.now()}` } as Camera;
    this.cameras.push(newCam);
    return newCam;
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'Résolu';
      return true;
    }
    return false;
  }
}

// Infrastructure Adapter: IPTV Repository
export class IPTVRepositoryAdapter implements IIPTVRepository {
  async getContents(type?: string): Promise<IPTVContentItem[]> {
    if (!type) return INITIAL_IPTV_CONTENTS;
    return INITIAL_IPTV_CONTENTS.filter(c => c.type === type);
  }

  async getPlaylists(): Promise<IPTVPlaylist[]> {
    return INITIAL_IPTV_PLAYLISTS;
  }
}
