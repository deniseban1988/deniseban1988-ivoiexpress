import { CityHubInfo, VehiclePhysicalLayout, SeatItem, VehicleLayoutType } from '../types/seat3d';

export const IVORIAN_CITY_HUBS: CityHubInfo[] = [
  {
    city: 'Abidjan',
    region: 'Lagunes',
    stations: [
      {
        id: 'st-abj-adjame',
        name: 'Gare Routière Centrale Adjamé VIP',
        city: 'Abidjan',
        commune: 'Adjamé',
        address: 'Boulevard Nangui Abrogoua, Face Mairie Adjamé',
        phone: '+225 27 20 22 10 00',
        isMainHub: true,
        coordinates: { lat: 5.3582, lng: -4.0256 }
      },
      {
        id: 'st-abj-plateau',
        name: 'Gare VIP Plateau Cité Administrative',
        city: 'Abidjan',
        commune: 'Plateau',
        address: 'Avenue Chardy, Près Tour Postel 2001',
        phone: '+225 27 20 30 40 50',
        isMainHub: false,
        coordinates: { lat: 5.3261, lng: -4.0197 }
      },
      {
        id: 'st-abj-yopougon',
        name: 'Gare Yopougon Keneya & Siporex',
        city: 'Abidjan',
        commune: 'Yopougon',
        address: 'Carrefour Keneya, Voie Express',
        phone: '+225 27 23 45 67 89',
        isMainHub: false,
        coordinates: { lat: 5.3411, lng: -4.0812 }
      },
      {
        id: 'st-abj-cocody',
        name: 'Terminal VIP Cocody Palmeraie & Riviera',
        city: 'Abidjan',
        commune: 'Cocody',
        address: 'Boulevard Mitterrand, Palmeraie Triangle',
        phone: '+225 27 22 44 88 00',
        isMainHub: false,
        coordinates: { lat: 5.3678, lng: -3.9654 }
      },
      {
        id: 'st-abj-koumassi',
        name: 'Gare Koumassi Jamaïque Sud',
        city: 'Abidjan',
        commune: 'Koumassi',
        address: 'Boulevard du Gabon, Carrefour Jamaïque',
        phone: '+225 27 21 35 12 34',
        isMainHub: false,
        coordinates: { lat: 5.2954, lng: -3.9512 }
      }
    ]
  },
  {
    city: 'Yamoussoukro',
    region: 'Bélier',
    stations: [
      {
        id: 'st-yakro-centrale',
        name: 'Gare Centrale Interurbaine Yamoussoukro',
        city: 'Yamoussoukro',
        commune: 'Habitat',
        address: 'Avenue Houphouët-Boigny, Face Basilique',
        phone: '+225 27 30 64 12 00',
        isMainHub: true,
        coordinates: { lat: 6.8205, lng: -5.2767 }
      },
      {
        id: 'st-yakro-president',
        name: 'Station VIP Hôtel Président',
        city: 'Yamoussoukro',
        commune: 'Quartier Résidentiel',
        address: 'Boulevard de la Présidence',
        phone: '+225 27 30 64 00 00',
        isMainHub: false,
        coordinates: { lat: 6.8123, lng: -5.2689 }
      }
    ]
  },
  {
    city: 'Bouaké',
    region: 'Gbêkê',
    stations: [
      {
        id: 'st-bouake-commerce',
        name: 'Gare Centrale du Commerce - Bouaké',
        city: 'Bouaké',
        commune: 'Commerce',
        address: 'Avenue de la Paix, Face Grand Marché',
        phone: '+225 27 31 63 20 10',
        isMainHub: true,
        coordinates: { lat: 7.6892, lng: -5.0315 }
      },
      {
        id: 'st-bouake-kennedy',
        name: 'Station VIP Kennedy Gonfreville',
        city: 'Bouaké',
        commune: 'Kennedy',
        address: 'Boulevard Reine Pokou',
        phone: '+225 27 31 63 99 88',
        isMainHub: false,
        coordinates: { lat: 7.6741, lng: -5.0456 }
      }
    ]
  },
  {
    city: 'San-Pédro',
    region: 'San-Pédro',
    stations: [
      {
        id: 'st-sanpedro-port',
        name: 'Gare Maritime & Portuaire San-Pédro',
        city: 'San-Pédro',
        commune: 'Zone Portuaire',
        address: 'Avenue du Port, Entrée Ouest',
        phone: '+225 27 34 71 10 20',
        isMainHub: true,
        coordinates: { lat: 4.7485, lng: -6.6363 }
      },
      {
        id: 'st-sanpedro-cite',
        name: 'Station Balnéaire Cité Balmer',
        city: 'San-Pédro',
        commune: 'Balmer',
        address: 'Route des Plages',
        phone: '+225 27 34 71 80 00',
        isMainHub: false,
        coordinates: { lat: 4.7321, lng: -6.6198 }
      }
    ]
  },
  {
    city: 'Korhogo',
    region: 'Poro',
    stations: [
      {
        id: 'st-korhogo-centre',
        name: 'Gare Centrale du Poro - Korhogo',
        city: 'Korhogo',
        commune: 'Koko',
        address: 'Place Félix Houphouët-Boigny',
        phone: '+225 27 36 86 00 11',
        isMainHub: true,
        coordinates: { lat: 9.4580, lng: -5.6296 }
      }
    ]
  },
  {
    city: 'Man',
    region: 'Tonkpi',
    stations: [
      {
        id: 'st-man-dix-huit',
        name: 'Gare des Dix-Huit Montagnes - Man',
        city: 'Man',
        commune: 'Grand Gbapleu',
        address: 'Boulevard de la Cascade',
        phone: '+225 27 33 79 12 34',
        isMainHub: true,
        coordinates: { lat: 7.4125, lng: -7.5538 }
      }
    ]
  },
  {
    city: 'Gagnoa',
    region: 'Gôh',
    stations: [
      {
        id: 'st-gagnoa-centrale',
        name: 'Gare Interurbaine Fromager - Gagnoa',
        city: 'Gagnoa',
        commune: 'Dioulabougou',
        address: 'Route de Soubré, Carrefour Babré',
        phone: '+225 27 32 77 40 50',
        isMainHub: true,
        coordinates: { lat: 6.1319, lng: -5.9506 }
      }
    ]
  }
];

// Helper to generate seat matrix
export function generateSeatMatrix(
  rows: number,
  colsType: '2+2' | '2+1' | '1+1',
  deck: 1 | 2 = 1,
  startSeatNum: number = 1,
  options?: {
    pmrRows?: number[];
    vipRows?: number[];
    blockedSeatNums?: number[];
    occupiedSeatNums?: number[];
    hasToiletAtRear?: boolean;
  }
): { seats: SeatItem[]; totalSeats: number; columnsCount: number; aisleCol: number } {
  const seats: SeatItem[] = [];
  let currentNum = startSeatNum;
  const pmrRows = options?.pmrRows || [1]; // Row 1 often PMR
  const vipRows = options?.vipRows || [1, 2];
  const blockedSeatNums = options?.blockedSeatNums || [];
  const occupiedSeatNums = options?.occupiedSeatNums || [];

  let columnsCount = 5; // default 2+2 (cols: 0, 1, aisle=2, 3, 4)
  let aisleCol = 2;

  if (colsType === '2+1') {
    columnsCount = 4; // cols: 0, 1, aisle=2, 3
    aisleCol = 2;
  } else if (colsType === '1+1') {
    columnsCount = 3; // cols: 0, aisle=1, 2
    aisleCol = 1;
  }

  for (let r = 1; r <= rows; r++) {
    const isRearRow = r === rows;
    const isToiletRow = options?.hasToiletAtRear && (r === rows || r === rows - 1);

    for (let c = 0; c < columnsCount; c++) {
      if (c === aisleCol && !isRearRow) {
        // Aisle space, no seat except possibly middle seat in rear back bench
        continue;
      }

      // If toilet at rear right
      if (isToiletRow && c >= aisleCol) {
        continue;
      }

      const seatNum = currentNum++;
      const isPmr = pmrRows.includes(r) && (c === 0 || c === columnsCount - 1);
      const isVip = vipRows.includes(r);
      const isBlocked = blockedSeatNums.includes(seatNum);
      const isOccupied = occupiedSeatNums.includes(seatNum);

      let category: SeatItem['category'] = 'STANDARD';
      let state: SeatItem['state'] = 'AVAILABLE';
      let priceModifier = 0;

      if (isPmr) {
        category = 'PMR';
        state = isOccupied ? 'OCCUPIED' : 'PMR';
      } else if (isVip) {
        category = 'VIP';
        state = isOccupied ? 'OCCUPIED' : 'AVAILABLE';
        priceModifier = 1000;
      }

      if (isBlocked) {
        state = 'BLOCKED';
      } else if (isOccupied) {
        state = 'OCCUPIED';
      }

      const colLetters = ['A', 'B', 'C', 'D', 'E'];
      const label = `${r}${colLetters[c] || ''}`;

      seats.push({
        id: `seat-d${deck}-r${r}-c${c}-${seatNum}`,
        seatNumber: seatNum,
        label,
        row: r,
        col: c,
        deck,
        category,
        state,
        priceModifier,
        amenities: isVip
          ? ['Cuir Premium', 'Inclinaison 140°', 'Prise 220V + USB-C', 'Repose-jambes']
          : isPmr
          ? ['Espace PMR Élargi', 'Accès direct allée', 'Appui renforcé']
          : ['Inclinable', 'Prise USB', 'Porte-gobelet', 'Climatisation individuelle']
      });
    }
  }

  return {
    seats,
    totalSeats: seats.length,
    columnsCount,
    aisleCol
  };
}

// Master Layout 1: Volvo Marcopolo G7 VIP (2+2, 32 places, 1 deck)
const layoutVolvo = generateSeatMatrix(8, '2+2', 1, 1, {
  pmrRows: [1],
  vipRows: [1, 2],
  occupiedSeatNums: [1, 2, 5, 6, 9, 10, 11, 14, 15, 18, 20, 21, 25, 26],
  hasToiletAtRear: true
});

export const MASTER_VEHICLE_LAYOUTS: VehiclePhysicalLayout[] = [
  {
    id: 'layout-volvo-g7-vip',
    name: 'Volvo Marcopolo G7 VIP (2+2)',
    code: 'LAYOUT-VOLVO-G7',
    type: 'COACH_2X2',
    decksCount: 1,
    rowsCount: 8,
    columnsCount: layoutVolvo.columnsCount,
    aisleColumnIndex: layoutVolvo.aisleCol,
    totalSeats: layoutVolvo.totalSeats,
    seats: layoutVolvo.seats,
    features: {
      hasFrontDoor: true,
      hasMiddleDoor: true,
      hasRearDoor: false,
      hasDriverCabin: true,
      hasToilet: true,
      toiletPosition: { row: 8, col: 4, deck: 1 },
      hasLuggageCompartment: true,
      hasMiniBar: true
    },
    description: 'Autocar de luxe 32 places grand confort avec toilettes à bord, climatisation bi-zone et sièges ergonomiques inclinables.',
    recommendedFor: 'Lignes directes VIP (Abidjan - Yamoussoukro, Abidjan - San-Pédro)'
  },
  {
    id: 'layout-mercedes-tourismo-2x1',
    name: 'Mercedes-Benz Tourismo Première Classe (2+1)',
    code: 'LAYOUT-MB-2X1',
    type: 'COACH_2X1',
    decksCount: 1,
    rowsCount: 8,
    columnsCount: 4,
    aisleColumnIndex: 2,
    totalSeats: 24,
    seats: generateSeatMatrix(8, '2+1', 1, 1, {
      pmrRows: [1],
      vipRows: [1, 2, 3, 4, 5, 6, 7, 8], // All VIP
      occupiedSeatNums: [1, 2, 3, 7, 8, 12, 13, 16],
      hasToiletAtRear: true
    }).seats,
    features: {
      hasFrontDoor: true,
      hasMiddleDoor: true,
      hasRearDoor: false,
      hasDriverCabin: true,
      hasToilet: true,
      toiletPosition: { row: 8, col: 3, deck: 1 },
      hasLuggageCompartment: true,
      hasMiniBar: true
    },
    description: 'Configuration Première Classe ultra spacieuse 2+1 avec sièges fauteuils cuir XL, repose-jambes motorisé et service hôtesse.',
    recommendedFor: 'Lignes Business & Executives (Abidjan - Yamoussoukro VIP, Abidjan - Bouaké VIP)'
  },
  {
    id: 'layout-scania-double-deck',
    name: 'Scania Irizar i8 Panoramique (Double Étage)',
    code: 'LAYOUT-SCANIA-DD',
    type: 'DOUBLE_DECK',
    decksCount: 2,
    rowsCount: 12, // Lower deck: 4 rows (16 seats), Upper deck: 10 rows (40 seats)
    columnsCount: 5,
    aisleColumnIndex: 2,
    totalSeats: 54,
    seats: [
      // Deck 1 (Lower): Lounge VIP
      ...generateSeatMatrix(4, '2+2', 1, 1, {
        pmrRows: [1],
        vipRows: [1, 2, 3, 4],
        occupiedSeatNums: [1, 2, 5, 6],
        hasToiletAtRear: true
      }).seats,
      // Deck 2 (Upper): Panoramic
      ...generateSeatMatrix(10, '2+2', 2, 17, {
        pmrRows: [],
        vipRows: [1], // Row 1 of deck 2 (panoramic view)
        occupiedSeatNums: [17, 18, 21, 22, 29, 30, 35, 36, 42, 43]
      }).seats
    ],
    features: {
      hasFrontDoor: true,
      hasMiddleDoor: true,
      hasRearDoor: false,
      hasDriverCabin: true,
      hasToilet: true,
      toiletPosition: { row: 4, col: 4, deck: 1 },
      hasStairs: true,
      stairsPosition: { row: 2, col: 2 },
      hasLuggageCompartment: true,
      hasMiniBar: true
    },
    description: 'Autocar géant à deux niveaux avec salon VIP inférieur et pont supérieur panoramique pour une vue imprenable sur le réseau routier ivoirien.',
    recommendedFor: 'Grandes liaisons nationales (Abidjan - Korhogo, Abidjan - Bouaké)'
  },
  {
    id: 'layout-toyota-coaster-vip',
    name: 'Toyota Coaster Navette VIP (1+2)',
    code: 'LAYOUT-COASTER-18',
    type: 'MINIBUS',
    decksCount: 1,
    rowsCount: 6,
    columnsCount: 4,
    aisleColumnIndex: 1,
    totalSeats: 18,
    seats: generateSeatMatrix(6, '2+1', 1, 1, {
      pmrRows: [1],
      vipRows: [1, 2],
      occupiedSeatNums: [2, 3, 7, 8, 12, 15]
    }).seats,
    features: {
      hasFrontDoor: true,
      hasMiddleDoor: false,
      hasRearDoor: true,
      hasDriverCabin: true,
      hasToilet: false,
      hasLuggageCompartment: true
    },
    description: 'Minibus compact grand confort 18 places, idéal pour les navettes express et transferts aéroportuaires.',
    recommendedFor: 'Navettes Express Assinie, Grand-Bassam, Bingerville'
  }
];

export function getLayoutForVehicle(vehicleType?: string, capacity?: number): VehiclePhysicalLayout {
  if (!vehicleType && !capacity) return MASTER_VEHICLE_LAYOUTS[0];

  const lower = (vehicleType || '').toLowerCase();
  if (lower.includes('double') || lower.includes('étage') || (capacity && capacity > 48)) {
    return MASTER_VEHICLE_LAYOUTS[2]; // Scania Double Deck
  }
  if (lower.includes('business') || lower.includes('2+1') || lower.includes('première') || (capacity && capacity <= 24 && capacity > 18)) {
    return MASTER_VEHICLE_LAYOUTS[1]; // Mercedes 2+1
  }
  if (lower.includes('coaster') || lower.includes('navette') || lower.includes('mini') || (capacity && capacity <= 18)) {
    return MASTER_VEHICLE_LAYOUTS[3]; // Toyota Coaster
  }
  return MASTER_VEHICLE_LAYOUTS[0]; // Default Volvo Marcopolo G7
}
