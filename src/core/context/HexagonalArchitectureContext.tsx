import React, { createContext, useContext, useMemo } from 'react';
import { TransportUseCases } from '../application/transport/TransportUseCases';
import { HotelUseCases } from '../application/hotel/HotelUseCases';
import { VisionUseCases } from '../application/vision/VisionUseCases';
import { IPTVUseCases } from '../application/iptv/IPTVUseCases';
import { TransversalUseCases } from '../application/transversal/TransversalUseCases';
import { AICoreUseCases } from '../application/aicore/AICoreUseCases';
import { AuthUseCases } from '../application/auth/AuthUseCases';

import {
  TransportRepositoryAdapter,
  HotelRepositoryAdapter,
  VisionRepositoryAdapter,
  IPTVRepositoryAdapter
} from '../infrastructure/repositories/InMemoryRepositories';

import { AuthRepositoryAdapter } from '../infrastructure/repositories/AuthRepositoryAdapter';
import { FirestoreAuthRepositoryAdapter } from '../infrastructure/repositories/FirestoreAuthRepositoryAdapter';

import {
  TransversalPaymentAdapter,
  MultiChannelNotificationAdapter,
  AuditLoggerAdapter
} from '../infrastructure/adapters/TransversalAdapters';

import { AICoreOrchestratorAdapter } from '../infrastructure/adapters/AICoreAdapter';

interface HexagonalServices {
  transportUseCases: TransportUseCases;
  hotelUseCases: HotelUseCases;
  visionUseCases: VisionUseCases;
  iptvUseCases: IPTVUseCases;
  transversalUseCases: TransversalUseCases;
  aiCoreUseCases: AICoreUseCases;
  authUseCases: AuthUseCases;
  auditLoggerAdapter: AuditLoggerAdapter;
}

const HexagonalContext = createContext<HexagonalServices | null>(null);

export const HexagonalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = useMemo(() => {
    // 1. Instantiating Secondary Adapters (Infrastructure)
    const transportRepo = new TransportRepositoryAdapter();
    const hotelRepo = new HotelRepositoryAdapter();
    const visionRepo = new VisionRepositoryAdapter();
    const iptvRepo = new IPTVRepositoryAdapter();
    const authRepo = new FirestoreAuthRepositoryAdapter();
    // const authRepo = new AuthRepositoryAdapter(); // Fallback LocalStorage

    const paymentAdapter = new TransversalPaymentAdapter();
    const notificationAdapter = new MultiChannelNotificationAdapter();
    const auditLoggerAdapter = new AuditLoggerAdapter();
    const aiCoreOrchestratorAdapter = new AICoreOrchestratorAdapter();

    // 2. Instantiating Primary Ports / Use Cases (Application Layer)
    const transportUseCases = new TransportUseCases(transportRepo, paymentAdapter, auditLoggerAdapter, authRepo);
    const hotelUseCases = new HotelUseCases(hotelRepo, paymentAdapter, auditLoggerAdapter, authRepo);
    const visionUseCases = new VisionUseCases(visionRepo, auditLoggerAdapter);
    const iptvUseCases = new IPTVUseCases(iptvRepo);
    const transversalUseCases = new TransversalUseCases(paymentAdapter, notificationAdapter, auditLoggerAdapter);
    const aiCoreUseCases = new AICoreUseCases(aiCoreOrchestratorAdapter, auditLoggerAdapter);
    const authUseCases = new AuthUseCases(authRepo, auditLoggerAdapter);

    return {
      transportUseCases,
      hotelUseCases,
      visionUseCases,
      iptvUseCases,
      transversalUseCases,
      aiCoreUseCases,
      authUseCases,
      auditLoggerAdapter
    };
  }, []);

  return (
    <HexagonalContext.Provider value={services}>
      {children}
    </HexagonalContext.Provider>
  );
};

export const useHexagonalArchitecture = () => {
  const context = useContext(HexagonalContext);
  if (!context) {
    throw new Error('useHexagonalArchitecture doit être utilisé à l\'intérieur de HexagonalProvider');
  }
  return context;
};
