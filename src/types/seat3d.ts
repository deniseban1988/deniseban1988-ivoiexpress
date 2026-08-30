export type SeatState = 'AVAILABLE' | 'SELECTED' | 'LOCKED' | 'OCCUPIED' | 'BLOCKED' | 'PMR' | 'VIP';

export type SeatCategory = 'STANDARD' | 'VIP' | 'PMR' | 'STAFF' | 'EMPTY';

export interface SeatItem {
  id: string;
  seatNumber: number;
  label: string;
  row: number;
  col: number; // 0 to columns - 1
  deck: 1 | 2; // 1 = lower / main deck, 2 = upper deck
  category: SeatCategory;
  state: SeatState;
  priceModifier?: number; // e.g. +1000 FCFA for VIP / front row
  assignedPassengerIndex?: number; // 0, 1, 2 for multi-traveler selection
  lockedBySessionId?: string;
  lockExpiresAt?: number; // timestamp in ms
  amenities?: string[]; // e.g. ['Prise 220V', 'USB Fast Charge', 'Repose-jambes', 'Écran individuel']
}

export type VehicleLayoutType = 'COACH_2X2' | 'COACH_2X1' | 'COACH_1X1' | 'MINIBUS' | 'DOUBLE_DECK';

export interface VehicleFeaturesConfig {
  hasFrontDoor: boolean;
  hasMiddleDoor: boolean;
  hasRearDoor: boolean;
  hasDriverCabin: boolean;
  hasToilet: boolean;
  toiletPosition?: { row: number; col: number; deck: 1 | 2 };
  hasStairs?: boolean;
  stairsPosition?: { row: number; col: number };
  hasLuggageCompartment: boolean;
  hasMiniBar?: boolean;
}

export interface VehiclePhysicalLayout {
  id: string;
  name: string;
  code: string;
  type: VehicleLayoutType;
  decksCount: 1 | 2;
  rowsCount: number;
  columnsCount: number; // e.g. 5 for 2 + aisle + 2 (0, 1, aisle=2, 3, 4)
  aisleColumnIndex: number;
  totalSeats: number;
  seats: SeatItem[];
  features: VehicleFeaturesConfig;
  description: string;
  recommendedFor: string;
}

export interface StationLocation {
  id: string;
  name: string;
  city: string;
  commune?: string;
  address: string;
  phone?: string;
  isMainHub: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface CityHubInfo {
  city: string;
  region: string;
  stations: StationLocation[];
}

export interface PassengerTravelerInfo {
  id: string;
  seatNumber: number;
  fullName: string;
  phone: string;
  email?: string;
  idCardNumber?: string;
  isPmr?: boolean;
  emergencyContact?: string;
  luggageCount: number;
  isForSelf?: boolean;
  beneficiaryAccountId?: string;
  beneficiaryAccountName?: string;
  notes?: string;
}

export interface SeatLockResponse {
  success: boolean;
  tripId: string;
  lockedSeats: number[];
  failedSeats: number[];
  lockSessionId: string;
  expiresAt: number;
  ttlSeconds: number;
  message?: string;
}

export interface BoardingScanResult {
  status: 'VALID' | 'ALREADY_USED' | 'CANCELLED' | 'NON_EXISTENT' | 'WRONG_TRIP';
  ticketCode?: string;
  passengerName?: string;
  seatNumber?: number;
  tripId?: string;
  tripDetails?: string;
  scannedAt: string;
  message: string;
}

export type TripLifecycleStatus = 'PLANNED' | 'BOARDING' | 'DEPARTED' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
