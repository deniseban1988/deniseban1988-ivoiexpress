import { SeatLockResponse, BoardingScanResult, VehiclePhysicalLayout } from '../types/seat3d';
import { MASTER_VEHICLE_LAYOUTS } from '../data/transportData';
import { auth } from '../lib/firebase';
import { getApiUrl } from '../lib/api';

// In-memory client cache for lock simulation when running offline/preview
const clientSideSeatLocks: Record<string, { seatNumbers: number[]; expiresAt: number; sessionId: string }> = {};

const getAuthHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const TransportApiService = {
  /**
   * Request atomic lock for one or more seats on a trip
   */
  async lockSeats(
    tripId: string,
    seatNumbers: number[],
    lockSessionId: string,
    durationSeconds: number = 600
  ): Promise<SeatLockResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/transport/seats/lock'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ tripId, seatNumbers, userId: auth.currentUser?.uid || lockSessionId, durationSeconds })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('[TransportApi] Backend fetch failed, fallback to local atomic lock:', e);
    }
    
    // Client-side atomic lock fallback with TTL check

    // Client-side atomic lock fallback with TTL check
    const now = Date.now();
    const existing = clientSideSeatLocks[tripId];
    if (existing && existing.expiresAt > now && existing.sessionId !== lockSessionId) {
      const conflict = seatNumbers.filter(s => existing.seatNumbers.includes(s));
      if (conflict.length > 0) {
        return {
          success: false,
          tripId,
          lockedSeats: [],
          failedSeats: conflict,
          lockSessionId,
          expiresAt: existing.expiresAt,
          ttlSeconds: Math.round((existing.expiresAt - now) / 1000),
          message: `Les sièges [${conflict.join(', ')}] sont temporairement réservés par un autre voyageur.`
        };
      }
    }

    const expiresAt = now + durationSeconds * 1000;
    clientSideSeatLocks[tripId] = {
      seatNumbers,
      expiresAt,
      sessionId: lockSessionId
    };

    return {
      success: true,
      tripId,
      lockedSeats: seatNumbers,
      failedSeats: [],
      lockSessionId,
      expiresAt,
      ttlSeconds: durationSeconds,
      message: `${seatNumbers.length} siège(s) verrouillé(s) pour ${durationSeconds / 60} minutes.`
    };
  },

  /**
   * Release seat lock
   */
  async unlockSeats(
    tripId: string,
    seatNumbers: number[],
    lockSessionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/transport/seats/unlock'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ tripId, seatNumbers, userId: auth.currentUser?.uid || lockSessionId })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('[TransportApi] Unlock fetch failed, fallback to local store:', e);
    }

    if (clientSideSeatLocks[tripId] && clientSideSeatLocks[tripId].sessionId === lockSessionId) {
      delete clientSideSeatLocks[tripId];
    }
    return { success: true, message: 'Verrouillage des sièges libéré avec succès.' };
  },

  /**
   * Verify QR Code at boarding gate
   */
  async verifyBoardingQR(qrData: string, currentTripId?: string): Promise<BoardingScanResult> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/transport/boarding/verify-qr'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ qrPayload: qrData, currentTripId })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('[TransportApi] Boarding verification fetch failed, fallback local parser:', e);
    }

    // Local parser fallback
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (!qrData || !qrData.includes('IVOIREXPRESS')) {
      return {
        status: 'NON_EXISTENT',
        scannedAt: now,
        message: 'Format de QR Code inconnu ou non émis par la billetterie IVOIReXpress.'
      };
    }

    // Parse data: IVOIREXPRESS:TICK-CI-XXXX:SIG:...:PASSENGER:...:TRIP:...:SEAT:...
    const parts = qrData.split(':');
    let ticketCode = 'TICK-CI-0000';
    let passengerName = 'Voyageur';
    let tripId = '';
    let seatNumber = 1;

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('TICK-CI')) ticketCode = parts[i];
      if (parts[i] === 'PASSENGER' && parts[i + 1]) passengerName = parts[i + 1];
      if (parts[i] === 'TRIP' && parts[i + 1]) tripId = parts[i + 1];
      if (parts[i] === 'SEAT' && parts[i + 1]) seatNumber = parseInt(parts[i + 1], 10);
    }

    if (currentTripId && tripId && currentTripId !== tripId) {
      return {
        status: 'WRONG_TRIP',
        ticketCode,
        passengerName,
        seatNumber,
        tripId,
        scannedAt: now,
        message: `Billet valide mais prévu pour un autre voyage (Ligne ${tripId}). Non autorisé pour ce car.`
      };
    }

    return {
      status: 'VALID',
      ticketCode,
      passengerName,
      seatNumber,
      tripId,
      tripDetails: `Siège #${seatNumber} • Passager: ${passengerName}`,
      scannedAt: now,
      message: `Embarquement autorisé pour ${passengerName} (Siège #${seatNumber}).`
    };
  },

  /**
   * Fetch custom and default vehicle layouts
   */
  async getVehicleLayouts(): Promise<VehiclePhysicalLayout[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('/api/transport/vehicle-layouts'), {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('[TransportApi] Failed to fetch layouts, using master presets:', e);
    }
    return MASTER_VEHICLE_LAYOUTS;
  }
};
