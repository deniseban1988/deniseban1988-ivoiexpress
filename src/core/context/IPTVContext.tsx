import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  IPTVContentItem,
  IPTVPlaylist,
  IPTVProvider,
  IPTVGlobalSettings,
  IPTVNotification,
  IPTVWatchHistoryItem,
  IPTVImportJobSummary,
  IPTVHealthReport,
  IPTVMaintenanceTask,
  StreamHealthClassification,
  StreamHealthJobSummary,
  StreamHealthCheckProgress
} from '../../types/iptv';
import {
  StreamHealthEngine,
  StreamProbeResult,
  StreamHealthEngineOptions
} from '../../lib/iptv/StreamHealthEngine';
import {
  INITIAL_IPTV_SETTINGS,
  INITIAL_IPTV_CONTENTS,
  INITIAL_IPTV_PLAYLISTS,
  INITIAL_IPTV_PROVIDERS,
  INITIAL_IPTV_NOTIFICATIONS,
  INITIAL_WATCH_HISTORY
} from '../../data/iptvMockData';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import {
  parseM3UContent,
  fetchAndParseM3UUrl,
  ParsedM3UChannel,
  inferChannelType,
  smartDeduplicateChannels,
  sanitizeStreamUrl
} from '../../lib/iptv/m3uParser';
import { batchVerifyStreams } from '../../lib/iptv/streamVerifier';
import {
  saveChannelsToIndexedDB,
  loadChannelsFromIndexedDB,
  savePlaylistsToIndexedDB,
  loadPlaylistsFromIndexedDB,
  deleteChannelFromIndexedDB,
  deletePlaylistFromIndexedDB,
  exportChannelsToM3U,
  clearLocalChannelsCache,
  countIndexedDBRecords,
  rebuildChannelsInIndexedDB
} from '../../lib/iptv/iptvStorage';

import {
  computeCatalogCategoryStats,
  CategoryStatItem,
  normalizeIPTVCategory
} from '../../lib/iptv/categoryNormalizer';

export interface IPTVLogEntry {
  id: string;
  timestamp: string;
  action: 'IMPORT' | 'SYNC' | 'DELETE' | 'HEALTH_CHECK' | 'ERROR' | 'RECONCILE' | 'MAINTENANCE' | 'SETTINGS_UPDATE';
  playlistName?: string;
  details: string;
  channelsCount?: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  actor?: string;
}

export interface IPTVDiagnosticStats {
  totalInMemory: number;
  totalInIndexedDb: number;
  firestoreCounts: {
    iptv_channels: number;
    iptv_contents: number;
    iptv: number;
    iptv_playlists: number;
  };
  lastSyncTime: string;
  activeFiltersCount?: number;
}

interface IPTVContextType {
  settings: IPTVGlobalSettings;
  contents: IPTVContentItem[];
  activePlaylist: IPTVContentItem[];
  playlists: IPTVPlaylist[];
  providers: IPTVProvider[];
  notifications: IPTVNotification[];
  watchHistory: IPTVWatchHistoryItem[];
  favorites: string[];
  logs: IPTVLogEntry[];
  isLoading: boolean;
  importProgress: {
    isImporting: boolean;
    currentBatch: number;
    totalBatches: number;
    processedChannels: number;
    totalChannels: number;
    statusText: string;
  } | null;
  lastImportSummary: IPTVImportJobSummary | null;
  selectedAgencyScope: string;
  setSelectedAgencyScope: (agencyId: string) => void;
  
  // Actions
  updateSettings: (newSettings: IPTVGlobalSettings) => Promise<void>;
  
  // Playlists
  importPlaylistFromUrl: (
    url: string,
    name: string,
    provider: string,
    agencyId?: string,
    onProgress?: (processed: number, total: number, message: string) => void
  ) => Promise<{ success: boolean; count: number; message: string; summary?: IPTVImportJobSummary }>;
  importPlaylistFromFile: (
    fileContent: string,
    name: string,
    provider: string,
    agencyId?: string,
    onProgress?: (processed: number, total: number, message: string) => void
  ) => Promise<{ success: boolean; count: number; message: string; summary?: IPTVImportJobSummary }>;
  syncPlaylist: (playlistId: string) => Promise<{ success: boolean; message: string }>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  togglePlaylistStatus: (playlistId: string) => Promise<void>;

  // Contents / Channels
  addContent: (item: IPTVContentItem) => Promise<void>;
  updateContent: (item: IPTVContentItem) => Promise<void>;
  deleteContent: (contentId: string) => Promise<void>;
  toggleFavorite: (contentId: string) => void;
  recordWatchHistory: (content: IPTVContentItem, progressSeconds: number, totalSeconds: number) => void;
  clearWatchHistory: () => void;
  removeWatchHistoryItem: (id: string) => void;

  // Stream Health & Automated Self-Healing Maintenance
  streamHealthProgress: StreamHealthCheckProgress | null;
  lastHealthJobSummary: StreamHealthJobSummary | null;
  startStreamHealthCheck: (options?: {
    scope?: 'ALL' | 'SAMPLE' | 'PENDING' | 'DEAD' | 'UNSTABLE';
    sampleSize?: number;
    targetPlaylistId?: string;
  }) => Promise<StreamHealthJobSummary>;
  cancelStreamHealthCheck: () => void;
  testSingleStream: (channelId: string) => Promise<StreamProbeResult>;
  reactivateDeadStream: (channelId: string) => Promise<void>;
  cleanActivePlaylist: () => Promise<{ deadRemoved: number; activeRemaining: number; message: string }>;
  runBatchHealthCheck: (onProgress?: (count: number, total: number) => void) => Promise<void>;
  cleanDuplicateChannels: () => Promise<{ removedCount: number; message: string }>;
  cleanDeadChannels: () => Promise<{ markedCount: number; message: string }>;
  computeHealthReport: () => IPTVHealthReport;
  
  // Notifications & Logs
  addNotification: (notif: IPTVNotification) => Promise<void>;

  // Massive Data Diagnostic & Server Reconciliation
  reconcileAndCountAllCollections: () => Promise<IPTVDiagnosticStats>;
  rebuildLocalCacheFromServer: () => Promise<{ success: boolean; totalLoaded: number; message: string }>;
  clearLocalCacheAndReload: () => Promise<void>;
  exportCurrentChannelsM3U: () => string;
  categoryStats: CategoryStatItem[];
}

const IPTVContext = createContext<IPTVContextType | undefined>(undefined);

export const IPTVProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<IPTVGlobalSettings>(INITIAL_IPTV_SETTINGS);
  const [contents, setContents] = useState<IPTVContentItem[]>(INITIAL_IPTV_CONTENTS);
  const [playlists, setPlaylists] = useState<IPTVPlaylist[]>(INITIAL_IPTV_PLAYLISTS);
  const [providers, setProviders] = useState<IPTVProvider[]>(INITIAL_IPTV_PROVIDERS);
  const [notifications, setNotifications] = useState<IPTVNotification[]>(INITIAL_IPTV_NOTIFICATIONS);
  const [watchHistory, setWatchHistory] = useState<IPTVWatchHistoryItem[]>(INITIAL_WATCH_HISTORY);
  const [favorites, setFavorites] = useState<string[]>(['iptv-tv-rti1', 'iptv-tv-nci']);
  const [selectedAgencyScope, setSelectedAgencyScope] = useState<string>('NATIONAL');
  const [lastImportSummary, setLastImportSummary] = useState<IPTVImportJobSummary | null>(null);
  const [streamHealthProgress, setStreamHealthProgress] = useState<StreamHealthCheckProgress | null>(null);
  const [lastHealthJobSummary, setLastHealthJobSummary] = useState<StreamHealthJobSummary | null>(null);

  // Active Clean Playlist: only contains verified functional / unstable channels, filters out confirmed dead channels
  const activePlaylist = useMemo(() => {
    return StreamHealthEngine.getActivePlaylist(contents);
  }, [contents]);

  // Dynamic Catalog Category Statistics (Computed across all 13,436+ channels)
  const categoryStats = useMemo<CategoryStatItem[]>(() => {
    return computeCatalogCategoryStats(contents).categoryStats;
  }, [contents]);
  const [logs, setLogs] = useState<IPTVLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      action: 'IMPORT',
      playlistName: 'RTI Bouquet National',
      details: "Initialisation du moteur IPTV national avec sécurisation de la persistance.",
      channelsCount: 4,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean;
    currentBatch: number;
    totalBatches: number;
    processedChannels: number;
    totalChannels: number;
    statusText: string;
  } | null>(null);

  // Helper to add log
  const addLogEntry = useCallback(async (entry: Omit<IPTVLogEntry, 'id' | 'timestamp'>) => {
    const newLog: IPTVLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    };

    setLogs(prev => [newLog, ...prev]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'iptv_logs', newLog.id), newLog);
      } catch (e) {
        console.warn('Failed to write log to Firestore:', e);
      }
    }
  }, []);

  // 1. Initial Load from IndexedDB (High speed for 13,000+ records)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const cachedChannels = await loadChannelsFromIndexedDB();
        const cachedPlaylists = await loadPlaylistsFromIndexedDB();

        if (isMounted) {
          if (cachedChannels.length > 0) {
            setContents(cachedChannels);
          }
          if (cachedPlaylists.length > 0) {
            setPlaylists(cachedPlaylists);
          }
        }
      } catch (err) {
        console.warn('[IPTVContext] Failed to load from IndexedDB cache:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Real-time Synchronization with Cloud Firestore across ALL potential collections
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setIsLoading(false);
      return;
    }

    let unsubChannels: (() => void) | undefined;
    let unsubIptvLegacy: (() => void) | undefined;
    let unsubPlaylists: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    try {
      // 1. Subscribe to 'iptv_channels'
      unsubChannels = onSnapshot(
        collection(db, 'iptv_channels'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedChannels: IPTVContentItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              loadedChannels.push({ id: docSnap.id, ...data } as IPTVContentItem);
            });

            setContents((prev) => {
              const channelMap = new Map<string, IPTVContentItem>();
              prev.forEach((c) => channelMap.set(c.id, c));
              loadedChannels.forEach((c) => channelMap.set(c.id, c));
              const merged = Array.from(channelMap.values());
              saveChannelsToIndexedDB(merged);
              return merged;
            });
          }
          setIsLoading(false);
        },
        (error) => {
          console.warn('[IPTVContext] Error listening to iptv_channels:', error);
          setIsLoading(false);
        }
      );

      // 2. Also listen to collection 'iptv' (in case channels were written there)
      unsubIptvLegacy = onSnapshot(
        collection(db, 'iptv'),
        (snapshot) => {
          if (!snapshot.empty) {
            const legacyLoaded: IPTVContentItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              if (data.name || data.title || data.streamUrl) {
                legacyLoaded.push({
                  id: docSnap.id,
                  name: data.name || data.title || 'Chaîne',
                  type: data.type || inferChannelType(data.name || data.title || '', data.category || '', data.streamUrl || ''),
                  category: data.category || 'Général',
                  streamUrl: data.streamUrl || '',
                  logoUrl: data.logoUrl || data.posterUrl || '',
                  quality: data.quality || '1080p Full HD',
                  status: data.status || 'Actif',
                  language: data.language || 'Français',
                  country: data.country || "Côte d'Ivoire",
                  viewsCount: data.viewsCount || 1,
                  agencyId: data.agencyId || 'NATIONAL',
                  ...data
                } as IPTVContentItem);
              }
            });

            if (legacyLoaded.length > 0) {
              setContents((prev) => {
                const channelMap = new Map<string, IPTVContentItem>();
                prev.forEach((c) => channelMap.set(c.id, c));
                legacyLoaded.forEach((c) => {
                  if (!channelMap.has(c.id)) {
                    channelMap.set(c.id, c);
                  }
                });
                const merged = Array.from(channelMap.values());
                saveChannelsToIndexedDB(merged);
                return merged;
              });
            }
          }
        },
        (error) => {
          console.warn('[IPTVContext] Error listening to collection /iptv:', error);
        }
      );

      // 3. Subscribe to 'iptv_playlists'
      unsubPlaylists = onSnapshot(
        collection(db, 'iptv_playlists'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedPl: IPTVPlaylist[] = [];
            snapshot.forEach((docSnap) => {
              loadedPl.push({ id: docSnap.id, ...docSnap.data() } as IPTVPlaylist);
            });
            setPlaylists(loadedPl);
            savePlaylistsToIndexedDB(loadedPl);
          }
        },
        (error) => {
          console.warn('[IPTVContext] Error listening to iptv_playlists:', error);
        }
      );

      // 4. Subscribe to 'iptv_logs'
      unsubLogs = onSnapshot(
        collection(db, 'iptv_logs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedLogs: IPTVLogEntry[] = [];
            snapshot.forEach((docSnap) => {
              loadedLogs.push({ id: docSnap.id, ...docSnap.data() } as IPTVLogEntry);
            });
            loadedLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
            setLogs(loadedLogs);
          }
        },
        (error) => {
          console.warn('[IPTVContext] Error listening to iptv_logs:', error);
        }
      );
    } catch (err) {
      console.warn('[IPTVContext] Firestore subscription setup failed:', err);
      setIsLoading(false);
    }

    return () => {
      if (unsubChannels) unsubChannels();
      if (unsubIptvLegacy) unsubIptvLegacy();
      if (unsubPlaylists) unsubPlaylists();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // 3. Update Settings
  const updateSettings = async (newSettings: IPTVGlobalSettings) => {
    setSettings(newSettings);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'iptv_settings', 'global'), newSettings, { merge: true });
      } catch (e) {
        console.warn('Failed to save IPTV settings to Firestore:', e);
      }
    }
  };

  // 4. Save Parsed Channels with Smart Deduplication Pipeline (Supports 500,000+ channels)
  const saveParsedChannelsAndPlaylist = async (
    parsedChannels: ParsedM3UChannel[],
    playlistName: string,
    provider: string,
    sourceUrl: string,
    format: 'M3U' | 'M3U8',
    agencyId: string = 'NATIONAL',
    onProgress?: (processed: number, total: number, message: string) => void
  ) => {
    const startTime = Date.now();
    const playlistId = `pl-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 1. Smart Deduplication against existing catalog
    const dedupeResult = smartDeduplicateChannels(parsedChannels, contents);
    const uniqueChannels = dedupeResult.uniqueChannels;

    const newPlaylist: IPTVPlaylist = {
      id: playlistId,
      name: playlistName,
      provider: provider || 'Import M3U',
      format,
      sourceUrl,
      totalChannels: uniqueChannels.length,
      activeChannels: uniqueChannels.length,
      status: 'Actif',
      lastUpdated: nowIso,
      autoSync: true,
      agencyId: agencyId || 'NATIONAL',
      lastSyncResult: {
        success: true,
        addedCount: uniqueChannels.length,
        updatedCount: 0,
        duplicateCount: dedupeResult.duplicateCount
      }
    };

    const newContents: IPTVContentItem[] = uniqueChannels.map((ch, index) => ({
      id: ch.id || `iptv-ch-${Date.now()}-${index}`,
      name: ch.name,
      logoUrl: ch.logoUrl,
      type: ch.type,
      category: ch.groupTitle,
      language: ch.language,
      country: ch.country,
      quality: (ch.quality as any) || '1080p Full HD',
      status: 'Actif',
      streamUrl: ch.streamUrl,
      viewsCount: 1,
      rating: 4.8,
      playlistId: playlistId,
      providerName: provider,
      currentProgram: ch.currentProgram,
      nextProgram: ch.nextProgram,
      tvgId: ch.tvgId,
      tvgName: ch.tvgName,
      agencyId: agencyId || 'NATIONAL',
      createdAt: nowIso
    }));

    // 2. Instant local state update (Immediate UI feedback)
    const updatedPlaylists = [newPlaylist, ...playlists];
    const allMergedContents = [...newContents, ...contents];

    setPlaylists(updatedPlaylists);
    setContents(allMergedContents);

    // 3. High-speed IndexedDB persistence
    await savePlaylistsToIndexedDB(updatedPlaylists);
    await saveChannelsToIndexedDB(allMergedContents);

    // 4. Record Import Job Summary
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    const streamCollisions = dedupeResult.duplicateDetails?.filter(d => d.reason === 'STREAM_URL_COLLISION').length || 0;
    const tvgIdCollisions = dedupeResult.duplicateDetails?.filter(d => d.reason === 'TVG_ID_COLLISION').length || 0;
    const sigCollisions = dedupeResult.duplicateDetails?.filter(d => d.reason === 'SIGNATURE_MATCH').length || 0;

    const summary: IPTVImportJobSummary = {
      id: `job-${Date.now()}`,
      playlistName,
      provider,
      sourceUrl,
      agencyId: agencyId || 'NATIONAL',
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSeconds: durationSec,
      totalToImport: parsedChannels.length,
      processedCount: parsedChannels.length,
      succeededCount: newContents.length,
      rejectedCount: 0,
      duplicateCount: dedupeResult.duplicateCount,
      totalProcessed: parsedChannels.length,
      addedUnique: newContents.length,
      deduplicatedCount: dedupeResult.duplicateCount,
      deduplicationReasonBreakdown: {
        streamUrl: streamCollisions,
        tvgId: tvgIdCollisions,
        nameAndCountry: sigCollisions
      },
      duplicateDetails: dedupeResult.duplicateDetails,
      errors: [],
      status: 'TERMINE'
    };
    setLastImportSummary(summary);

    // 5. Batch write to Firestore with progress reporting
    if (isFirebaseConfigured && db) {
      (async () => {
        try {
          await setDoc(doc(db, 'iptv_playlists', playlistId), newPlaylist);

          const chunkSize = 250;
          const totalBatches = Math.ceil(newContents.length / chunkSize);

          setImportProgress({
            isImporting: true,
            currentBatch: 0,
            totalBatches,
            processedChannels: 0,
            totalChannels: newContents.length,
            statusText: `Démarrage de l'enregistrement serveur de ${newContents.length} chaînes...`
          });

          for (let i = 0; i < newContents.length; i += chunkSize) {
            const chunk = newContents.slice(i, i + chunkSize);
            const batchNum = Math.floor(i / chunkSize) + 1;
            const batch = writeBatch(db);

            chunk.forEach((item) => {
              batch.set(doc(db, 'iptv_channels', item.id), item);
              batch.set(doc(db, 'iptv', item.id), item, { merge: true });
            });

            await batch.commit();

            const processedCount = Math.min(i + chunkSize, newContents.length);
            const progressMsg = `Lot ${batchNum}/${totalBatches} synchronisé (${processedCount} / ${newContents.length} chaînes)`;

            setImportProgress({
              isImporting: true,
              currentBatch: batchNum,
              totalBatches,
              processedChannels: processedCount,
              totalChannels: newContents.length,
              statusText: progressMsg
            });

            if (onProgress) {
              onProgress(processedCount, newContents.length, progressMsg);
            }

            if (i + chunkSize < newContents.length) {
              await new Promise((res) => setTimeout(res, 20));
            }
          }

          setImportProgress(null);
        } catch (err: any) {
          console.warn('[IPTVContext] Background Firestore batch write error:', err);
          setImportProgress(null);
        }
      })();
    }

    await addLogEntry({
      action: 'IMPORT',
      playlistName,
      details: `Importation réussie : ${newContents.length} nouvelles chaînes ajoutées (${dedupeResult.duplicateCount} doublons ignorés, ${parsedChannels.length} total analysées).`,
      channelsCount: newContents.length,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    });

    return {
      success: true,
      count: newContents.length,
      message: `Importation réussie ! ${newContents.length} chaînes intégrées (${dedupeResult.duplicateCount} doublons filtrés).`,
      summary
    };
  };

  // 5. Import from URL
  const importPlaylistFromUrl = async (
    url: string,
    name: string,
    provider: string,
    agencyId: string = 'NATIONAL',
    onProgress?: (processed: number, total: number, message: string) => void
  ) => {
    try {
      const parsed = await fetchAndParseM3UUrl(url, name);
      if (parsed.channels.length === 0) {
        return {
          success: false,
          count: 0,
          message: "Aucune chaîne valide n'a pu être extraite de ce lien M3U."
        };
      }

      return await saveParsedChannelsAndPlaylist(
        parsed.channels,
        name,
        provider,
        url,
        url.includes('.m3u8') ? 'M3U8' : 'M3U',
        agencyId,
        onProgress
      );
    } catch (err: any) {
      await addLogEntry({
        action: 'ERROR',
        playlistName: name,
        details: `Erreur d'importation M3U par URL: ${err.message}`,
        status: 'ERROR'
      });
      return {
        success: false,
        count: 0,
        message: err.message || "Erreur lors de l'importation de la playlist."
      };
    }
  };

  // 6. Import from Raw File Content
  const importPlaylistFromFile = async (
    fileContent: string,
    name: string,
    provider: string,
    agencyId: string = 'NATIONAL',
    onProgress?: (processed: number, total: number, message: string) => void
  ) => {
    try {
      const parsed = parseM3UContent(fileContent, name);
      if (parsed.channels.length === 0) {
        return {
          success: false,
          count: 0,
          message: "Le fichier M3U/M3U8 importé ne contient aucune chaîne valide."
        };
      }

      return await saveParsedChannelsAndPlaylist(
        parsed.channels,
        name,
        provider,
        'Fichier Local',
        'M3U',
        agencyId,
        onProgress
      );
    } catch (err: any) {
      await addLogEntry({
        action: 'ERROR',
        playlistName: name,
        details: `Erreur lors de la lecture du fichier M3U: ${err.message}`,
        status: 'ERROR'
      });
      return {
        success: false,
        count: 0,
        message: err.message || "Erreur lors du traitement du fichier M3U."
      };
    }
  };

  // 7. Sync Playlist from remote URL
  const syncPlaylist = async (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || !pl.sourceUrl || pl.sourceUrl === 'Fichier Local') {
      return { success: false, message: "Cette playlist n'a pas d'URL distante pour la synchronisation automatique." };
    }

    try {
      const parsed = await fetchAndParseM3UUrl(pl.sourceUrl, pl.name);
      const dedupeResult = smartDeduplicateChannels(parsed.channels, contents.filter(c => c.playlistId !== playlistId));

      const updatedPl: IPTVPlaylist = {
        ...pl,
        totalChannels: dedupeResult.uniqueChannels.length,
        lastUpdated: new Date().toISOString(),
        lastSyncResult: {
          success: true,
          addedCount: dedupeResult.uniqueChannels.length,
          updatedCount: 0,
          duplicateCount: dedupeResult.duplicateCount
        }
      };

      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? updatedPl : p)));
      await savePlaylistsToIndexedDB(playlists.map((p) => (p.id === playlistId ? updatedPl : p)));

      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'iptv_playlists', playlistId), updatedPl, { merge: true });
      }

      await addLogEntry({
        action: 'SYNC',
        playlistName: pl.name,
        details: `Synchronisation réussie (${dedupeResult.uniqueChannels.length} chaînes validées, ${dedupeResult.duplicateCount} doublons ignorés).`,
        channelsCount: dedupeResult.uniqueChannels.length,
        status: 'SUCCESS'
      });

      return { success: true, message: `Playlist synchronisée avec succès (${dedupeResult.uniqueChannels.length} chaînes).` };
    } catch (err: any) {
      await addLogEntry({
        action: 'ERROR',
        playlistName: pl.name,
        details: `Échec de la synchronisation automatique: ${err.message}`,
        status: 'ERROR'
      });
      return { success: false, message: `Échec de la synchronisation: ${err.message}` };
    }
  };

  // 8. Delete Playlist
  const deletePlaylist = async (playlistId: string) => {
    const targetPl = playlists.find((p) => p.id === playlistId);

    const filteredPlaylists = playlists.filter((p) => p.id !== playlistId);
    const filteredContents = contents.filter((c) => c.playlistId !== playlistId);

    setPlaylists(filteredPlaylists);
    setContents(filteredContents);

    await deletePlaylistFromIndexedDB(playlistId);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'iptv_playlists', playlistId));
      } catch (e) {
        console.warn('Error deleting playlist doc in Firestore:', e);
      }
    }

    if (targetPl) {
      await addLogEntry({
        action: 'DELETE',
        playlistName: targetPl.name,
        details: `Playlist "${targetPl.name}" et ses chaînes associées supprimées avec succès.`,
        status: 'WARNING',
        actor: 'SuperAdmin'
      });
    }
  };

  // 9. Toggle Playlist Status
  const togglePlaylistStatus = async (playlistId: string) => {
    const updated = playlists.map((p) => {
      if (p.id === playlistId) {
        const nextStatus: 'Actif' | 'Inactif' = p.status === 'Actif' ? 'Inactif' : 'Actif';
        return { ...p, status: nextStatus };
      }
      return p;
    });

    setPlaylists(updated);
    await savePlaylistsToIndexedDB(updated);

    if (isFirebaseConfigured && db) {
      const target = updated.find((p) => p.id === playlistId);
      if (target) {
        try {
          await setDoc(doc(db, 'iptv_playlists', playlistId), target, { merge: true });
        } catch (e) {
          console.warn('Error updating playlist status in Firestore:', e);
        }
      }
    }
  };

  // 10. Channel CRUD: Add
  const addContent = async (item: IPTVContentItem) => {
    const updated = [item, ...contents];
    setContents(updated);
    await saveChannelsToIndexedDB(updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'iptv_channels', item.id), item);
        await setDoc(doc(db, 'iptv', item.id), item);
      } catch (e) {
        console.warn('Error saving channel to Firestore:', e);
      }
    }
  };

  // 11. Channel CRUD: Update
  const updateContent = async (item: IPTVContentItem) => {
    const updated = contents.map((c) => (c.id === item.id ? item : c));
    setContents(updated);
    await saveChannelsToIndexedDB(updated);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'iptv_channels', item.id), item, { merge: true });
        await setDoc(doc(db, 'iptv', item.id), item, { merge: true });
      } catch (e) {
        console.warn('Error updating channel in Firestore:', e);
      }
    }
  };

  // 12. Channel CRUD: Delete
  const deleteContent = async (contentId: string) => {
    const updated = contents.filter((c) => c.id !== contentId);
    setContents(updated);
    await deleteChannelFromIndexedDB(contentId);

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'iptv_channels', contentId));
        await deleteDoc(doc(db, 'iptv', contentId));
      } catch (e) {
        console.warn('Error deleting channel doc in Firestore:', e);
      }
    }
  };

  // 13. Favorites Toggle
  const toggleFavorite = (contentId: string) => {
    setFavorites((prev) =>
      prev.includes(contentId) ? prev.filter((id) => id !== contentId) : [...prev, contentId]
    );
  };

  // 14. Record Watch History
  const recordWatchHistory = (content: IPTVContentItem, progressSeconds: number, totalSeconds: number) => {
    const existingIndex = watchHistory.findIndex((h) => h.contentId === content.id);
    const completed = totalSeconds > 0 && progressSeconds / totalSeconds >= 0.9;

    const newHistoryItem: IPTVWatchHistoryItem = {
      id: existingIndex !== -1 ? watchHistory[existingIndex].id : `hist-${Date.now()}`,
      contentId: content.id,
      contentTitle: content.name,
      contentType: content.type,
      logoUrl: content.logoUrl,
      watchedAt: "À l'instant",
      progressSeconds,
      totalSeconds,
      completed
    };

    setWatchHistory((prev) => {
      const filtered = prev.filter((h) => h.contentId !== content.id);
      return [newHistoryItem, ...filtered];
    });
  };

  const clearWatchHistory = () => setWatchHistory([]);
  const removeWatchHistoryItem = (id: string) => setWatchHistory((prev) => prev.filter((h) => h.id !== id));

  // 15. Stream Health Check Engine & Batch Runner
  const startStreamHealthCheck = async (options?: {
    scope?: 'ALL' | 'SAMPLE' | 'PENDING' | 'DEAD' | 'UNSTABLE';
    sampleSize?: number;
    targetPlaylistId?: string;
  }): Promise<StreamHealthJobSummary> => {
    const scope = options?.scope || 'ALL';
    let targetChannels: IPTVContentItem[] = [...contents];

    if (options?.targetPlaylistId) {
      targetChannels = targetChannels.filter(c => c.playlistId === options.targetPlaylistId);
    }

    if (scope === 'PENDING') {
      targetChannels = targetChannels.filter(c => !c.healthClassification || c.healthClassification === 'PENDING');
    } else if (scope === 'DEAD') {
      targetChannels = targetChannels.filter(c => c.healthClassification === 'DEAD' || c.status === 'Inactif');
    } else if (scope === 'UNSTABLE') {
      targetChannels = targetChannels.filter(c => c.healthClassification === 'UNSTABLE');
    } else if (scope === 'SAMPLE') {
      const size = options?.sampleSize || 100;
      targetChannels = targetChannels.slice(0, size);
    }

    if (targetChannels.length === 0) {
      const emptySummary: StreamHealthJobSummary = {
        id: `health-job-${Date.now()}`,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        totalTested: 0,
        activeCount: 0,
        unstableCount: 0,
        deadCount: 0,
        pendingCount: 0,
        reactivatedCount: 0,
        averageStartupTimeMs: 0,
        status: 'COMPLETED',
        activePlaylistTotal: activePlaylist.length,
        sourceCatalogTotal: contents.length
      };
      setLastHealthJobSummary(emptySummary);
      return emptySummary;
    }

    setStreamHealthProgress({
      isRunning: true,
      testedCount: 0,
      totalCount: targetChannels.length,
      activeCount: 0,
      unstableCount: 0,
      deadCount: 0,
      currentChannelName: targetChannels[0]?.name
    });

    const result = await StreamHealthEngine.runBatchHealthCheck(targetChannels, {
      failureThreshold: settings.healthCheckConsecutiveFailureThreshold || 3,
      concurrency: settings.healthCheckConcurrency || 6,
      timeoutMs: 4500,
      onProgress: (prog) => {
        setStreamHealthProgress({ ...prog });
      },
      onChunkCompleted: async (updatedChunk) => {
        // Save intermediate results to IndexedDB so massive catalogs don't lose data
        await saveChannelsToIndexedDB(updatedChunk);
      }
    });

    // Merge updated targets back into state contents
    const updatedMap = new Map(result.updatedChannels.map(c => [c.id, c]));
    const mergedContents = contents.map(c => updatedMap.get(c.id) || c);

    setContents(mergedContents);
    await saveChannelsToIndexedDB(mergedContents);
    setLastHealthJobSummary(result.summary);
    setStreamHealthProgress(null);

    await addLogEntry({
      action: 'HEALTH_CHECK',
      details: `Health Check exécuté sur ${result.summary.totalTested} flux : ${result.summary.activeCount} Actifs 🟢, ${result.summary.unstableCount} Instables/Lents 🟠, ${result.summary.deadCount} Morts 🔴, ${result.summary.reactivatedCount} Réactivés ⚡ (Moyenne TTFF: ${(result.summary.averageStartupTimeMs / 1000).toFixed(2)}s).`,
      channelsCount: result.summary.totalTested,
      status: result.summary.deadCount > 0 ? 'WARNING' : 'SUCCESS',
      actor: 'StreamHealthEngine'
    });

    return result.summary;
  };

  const cancelStreamHealthCheck = () => {
    StreamHealthEngine.cancelRunningCheck();
    setStreamHealthProgress(null);
  };

  // Test an individual channel in real-time
  const testSingleStream = async (channelId: string): Promise<StreamProbeResult> => {
    const target = contents.find(c => c.id === channelId);
    if (!target) {
      throw new Error(`Chaîne avec l'ID ${channelId} non trouvée.`);
    }

    const probe = await StreamHealthEngine.probeChannel(target, {
      failureThreshold: settings.healthCheckConsecutiveFailureThreshold || 3,
      timeoutMs: 5000
    });

    const updated = StreamHealthEngine.applyProbeResult(target, probe);
    const newContents = contents.map(c => (c.id === channelId ? updated : c));

    setContents(newContents);
    await saveChannelsToIndexedDB([updated]);

    return probe;
  };

  // Force reactive a stream manually
  const reactivateDeadStream = async (channelId: string): Promise<void> => {
    const target = contents.find(c => c.id === channelId);
    if (!target) return;

    const revived: IPTVContentItem = {
      ...target,
      status: 'Actif',
      healthClassification: 'ACTIVE',
      healthStatus: 'HEALTHY',
      consecutiveFailures: 0,
      isActivePlaylistEligible: true,
      lastHealthError: undefined,
      lastTestedAt: new Date().toISOString()
    };

    const newContents = contents.map(c => (c.id === channelId ? revived : c));
    setContents(newContents);
    await saveChannelsToIndexedDB([revived]);

    await addLogEntry({
      action: 'MAINTENANCE',
      details: `Réactivation manuelle du flux "${target.name}" dans la playlist active.`,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    });
  };

  // Clean active playlist: marks confirmed dead channels as inactive and ineligible
  const cleanActivePlaylist = async (): Promise<{ deadRemoved: number; activeRemaining: number; message: string }> => {
    let deadCount = 0;
    const updated = contents.map(c => {
      const isDead = c.healthClassification === 'DEAD' || (c.consecutiveFailures || 0) >= (settings.healthCheckConsecutiveFailureThreshold || 3);
      if (isDead) {
        deadCount++;
        return {
          ...c,
          status: 'Inactif' as const,
          isActivePlaylistEligible: false,
          healthClassification: 'DEAD' as const
        };
      }
      return {
        ...c,
        isActivePlaylistEligible: true
      };
    });

    setContents(updated);
    await saveChannelsToIndexedDB(updated);

    const activeRemaining = updated.filter(c => c.isActivePlaylistEligible !== false && c.healthClassification !== 'DEAD').length;

    await addLogEntry({
      action: 'MAINTENANCE',
      details: `Nettoyage de la playlist active : ${deadCount} flux morts retirés (conservés dans la playlist source), ${activeRemaining} flux opérationnels conservés.`,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    });

    return {
      deadRemoved: deadCount,
      activeRemaining,
      message: `Nettoyage réussi : ${deadCount} flux morts exclus de la playlist active, ${activeRemaining} flux disponibles pour les voyageurs.`
    };
  };

  // Legacy fallback batch verification
  const runBatchHealthCheck = async (onProgress?: (count: number, total: number) => void) => {
    await startStreamHealthCheck({ scope: 'ALL' });
  };

  // 16. Maintenance: Clean Duplicates
  const cleanDuplicateChannels = async (): Promise<{ removedCount: number; message: string }> => {
    const dedupeResult = smartDeduplicateChannels(contents.map(c => ({
      id: c.id,
      name: c.name,
      streamUrl: c.streamUrl,
      logoUrl: c.logoUrl,
      groupTitle: c.category,
      country: c.country,
      language: c.language,
      quality: c.quality,
      type: c.type,
      tvgId: c.tvgId,
      tvgName: c.tvgName
    })));

    const uniqueIds = new Set(dedupeResult.uniqueChannels.map(c => c.id));
    const cleanedContents = contents.filter(c => uniqueIds.has(c.id));
    const removedCount = contents.length - cleanedContents.length;

    setContents(cleanedContents);
    await rebuildChannelsInIndexedDB(cleanedContents);

    await addLogEntry({
      action: 'MAINTENANCE',
      details: `Nettoyage des doublons exécuté : ${removedCount} chaînes redondantes supprimées (${cleanedContents.length} conservées).`,
      channelsCount: removedCount,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    });

    return {
      removedCount,
      message: `Nettoyage terminé avec succès : ${removedCount} doublons éliminés.`
    };
  };

  // 17. Maintenance: Clean Dead Channels (marks inactive)
  const cleanDeadChannels = async (): Promise<{ markedCount: number; message: string }> => {
    let marked = 0;
    const updated = contents.map(c => {
      if (!c.streamUrl || !sanitizeStreamUrl(c.streamUrl) || c.healthStatus === 'UNREACHABLE') {
        marked++;
        return { ...c, status: 'Inactif' as const };
      }
      return c;
    });

    setContents(updated);
    await saveChannelsToIndexedDB(updated);

    await addLogEntry({
      action: 'MAINTENANCE',
      details: `Maintenance des flux : ${marked} chaînes inaccessibles marquées comme Inactives.`,
      channelsCount: marked,
      status: 'WARNING',
      actor: 'SuperAdmin'
    });

    return {
      markedCount: marked,
      message: `${marked} chaînes hors-ligne ont été désactivées du catalogue actif.`
    };
  };

  // 18. Compute IPTV Health Report
  const computeHealthReport = useCallback((): IPTVHealthReport => {
    let active = 0;
    let inactive = 0;
    let maintenance = 0;
    let missingLogos = 0;
    let missingEpg = 0;
    let invalidUrls = 0;

    const catCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();

    contents.forEach(c => {
      if (c.status === 'Actif') active++;
      else if (c.status === 'Inactif') inactive++;
      else maintenance++;

      if (!c.logoUrl || c.logoUrl.includes('ui-avatars.com') || c.logoUrl.trim() === '') missingLogos++;
      if (!c.tvgId && !c.currentProgram) missingEpg++;
      if (!c.streamUrl || !sanitizeStreamUrl(c.streamUrl)) invalidUrls++;

      catCounts.set(c.category, (catCounts.get(c.category) || 0) + 1);
      countryCounts.set(c.country, (countryCounts.get(c.country) || 0) + 1);
    });

    const total = contents.length;
    const healthScore = total === 0 ? 100 : Math.max(0, Math.round(
      ((active / total) * 60) +
      (((total - missingLogos) / total) * 20) +
      (((total - invalidUrls) / total) * 20)
    ));

    const topCategories = Array.from(catCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const playlistStatuses = playlists.map(pl => ({
      id: pl.id,
      name: pl.name,
      total: pl.totalChannels,
      active: pl.activeChannels || pl.totalChannels,
      status: pl.status,
      lastUpdated: pl.lastUpdated
    }));

    return {
      totalChannels: total,
      activeChannels: active,
      inactiveChannels: inactive,
      maintenanceChannels: maintenance,
      missingLogosCount: missingLogos,
      missingEpgCount: missingEpg,
      invalidUrlCount: invalidUrls,
      duplicatesCount: 0,
      healthScore,
      checkedAt: new Date().toLocaleTimeString(),
      playlistStatuses,
      topCategories,
      topCountries
    };
  }, [contents, playlists]);

  // 19. Notifications
  const addNotification = async (notif: IPTVNotification) => {
    setNotifications((prev) => [notif, ...prev]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'iptv_notifications', notif.id), notif);
      } catch (e) {
        console.warn('Error writing notification doc:', e);
      }
    }
  };

  // 20. Rebuild Local Cache strictly from Server (Source of Truth)
  const rebuildLocalCacheFromServer = async (): Promise<{ success: boolean; totalLoaded: number; message: string }> => {
    setIsLoading(true);
    const collected = new Map<string, IPTVContentItem>();

    if (isFirebaseConfigured && db) {
      try {
        const snapChannels = await getDocs(collection(db, 'iptv_channels'));
        snapChannels.forEach((docSnap) => {
          collected.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as IPTVContentItem);
        });

        const snapIptv = await getDocs(collection(db, 'iptv'));
        snapIptv.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.name || d.title || d.streamUrl) {
            collected.set(docSnap.id, {
              id: docSnap.id,
              name: d.name || d.title || 'Chaîne',
              type: d.type || inferChannelType(d.name || d.title || '', d.category || '', d.streamUrl || ''),
              category: d.category || 'Général',
              streamUrl: d.streamUrl || '',
              logoUrl: d.logoUrl || d.posterUrl || '',
              quality: d.quality || '1080p Full HD',
              status: d.status || 'Actif',
              language: d.language || 'Français',
              country: d.country || "Côte d'Ivoire",
              viewsCount: d.viewsCount || 1,
              ...d
            } as IPTVContentItem);
          }
        });
      } catch (e) {
        console.warn('Error pulling from Firestore during cache rebuild:', e);
      }
    }

    const freshList = Array.from(collected.values());
    if (freshList.length > 0) {
      setContents(freshList);
      await rebuildChannelsInIndexedDB(freshList);
    }
    setIsLoading(false);

    await addLogEntry({
      action: 'RECONCILE',
      details: `Reconstruction intégrale du cache local exécutée depuis Firestore (${freshList.length} chaînes synchronisées).`,
      channelsCount: freshList.length,
      status: 'SUCCESS',
      actor: 'SuperAdmin'
    });

    return {
      success: true,
      totalLoaded: freshList.length,
      message: `Reconstruction terminée avec succès : ${freshList.length} chaînes chargées depuis Firestore.`
    };
  };

  // 21. Clear Local Cache and Reload from Server
  const clearLocalCacheAndReload = async () => {
    await clearLocalChannelsCache();
    await rebuildLocalCacheFromServer();
  };

  // 22. Reconcile & Audit All Collections without destructive changes
  const reconcileAndCountAllCollections = async (): Promise<IPTVDiagnosticStats> => {
    let countIptvChannels = 0;
    let countIptvContents = 0;
    let countIptv = 0;
    let countPlaylists = 0;

    const collectedChannels = new Map<string, IPTVContentItem>();
    contents.forEach((c) => collectedChannels.set(c.id, c));

    if (isFirebaseConfigured && db) {
      try {
        try {
          const snapChannels = await getDocs(collection(db, 'iptv_channels'));
          countIptvChannels = snapChannels.size;
          snapChannels.forEach((docSnap) => {
            const d = docSnap.data();
            collectedChannels.set(docSnap.id, { id: docSnap.id, ...d } as IPTVContentItem);
          });
        } catch (err) {
          console.warn('Error querying iptv_channels:', err);
        }

        try {
          const snapContents = await getDocs(collection(db, 'iptv_contents'));
          countIptvContents = snapContents.size;
          snapContents.forEach((docSnap) => {
            const d = docSnap.data();
            collectedChannels.set(docSnap.id, { id: docSnap.id, ...d } as IPTVContentItem);
          });
        } catch (err) {
          console.warn('Error querying iptv_contents:', err);
        }

        try {
          const snapIptv = await getDocs(collection(db, 'iptv'));
          countIptv = snapIptv.size;
          snapIptv.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.name || d.title || d.streamUrl) {
              collectedChannels.set(docSnap.id, {
                id: docSnap.id,
                name: d.name || d.title || 'Chaîne',
                type: d.type || 'TV',
                category: d.category || 'Général',
                streamUrl: d.streamUrl || '',
                logoUrl: d.logoUrl || d.posterUrl || '',
                quality: d.quality || '1080p Full HD',
                status: d.status || 'Actif',
                language: d.language || 'Français',
                country: d.country || "Côte d'Ivoire",
                viewsCount: d.viewsCount || 1,
                ...d
              } as IPTVContentItem);
            }
          });
        } catch (err) {
          console.warn('Error querying iptv:', err);
        }

        try {
          const snapPl = await getDocs(collection(db, 'iptv_playlists'));
          countPlaylists = snapPl.size;
          const loadedPl: IPTVPlaylist[] = [];
          snapPl.forEach((docSnap) => {
            loadedPl.push({ id: docSnap.id, ...docSnap.data() } as IPTVPlaylist);
          });
          if (loadedPl.length > 0) {
            setPlaylists(loadedPl);
            await savePlaylistsToIndexedDB(loadedPl);
          }
        } catch (err) {
          console.warn('Error querying iptv_playlists:', err);
        }
      } catch (globalErr) {
        console.warn('Error during collection reconciliation:', globalErr);
      }
    }

    const mergedList = Array.from(collectedChannels.values());
    setContents(mergedList);
    await saveChannelsToIndexedDB(mergedList);

    const indexedDbCount = (await loadChannelsFromIndexedDB()).length;

    await addLogEntry({
      action: 'RECONCILE',
      details: `Réconciliation et audit multi-collections exécuté : ${mergedList.length} chaînes unifiées (iptv_channels: ${countIptvChannels}, iptv: ${countIptv}, iptv_contents: ${countIptvContents}, IndexedDB: ${indexedDbCount}).`,
      channelsCount: mergedList.length,
      status: 'SUCCESS'
    });

    return {
      totalInMemory: mergedList.length,
      totalInIndexedDb: indexedDbCount,
      firestoreCounts: {
        iptv_channels: countIptvChannels,
        iptv_contents: countIptvContents,
        iptv: countIptv,
        iptv_playlists: countPlaylists
      },
      lastSyncTime: new Date().toLocaleTimeString()
    };
  };

  // 23. Export Current Channels to M3U File
  const exportCurrentChannelsM3U = (): string => {
    return exportChannelsToM3U(contents, 'IVOIREXPRESS_IPTV_NATIONAL_BACKUP');
  };

  return (
    <IPTVContext.Provider
      value={{
        settings,
        contents,
        activePlaylist,
        playlists,
        providers,
        notifications,
        watchHistory,
        favorites,
        logs,
        isLoading,
        importProgress,
        lastImportSummary,
        streamHealthProgress,
        lastHealthJobSummary,
        selectedAgencyScope,
        setSelectedAgencyScope,
        updateSettings,
        importPlaylistFromUrl,
        importPlaylistFromFile,
        syncPlaylist,
        deletePlaylist,
        togglePlaylistStatus,
        addContent,
        updateContent,
        deleteContent,
        toggleFavorite,
        recordWatchHistory,
        clearWatchHistory,
        removeWatchHistoryItem,
        startStreamHealthCheck,
        cancelStreamHealthCheck,
        testSingleStream,
        reactivateDeadStream,
        cleanActivePlaylist,
        runBatchHealthCheck,
        cleanDuplicateChannels,
        cleanDeadChannels,
        computeHealthReport,
        addNotification,
        reconcileAndCountAllCollections,
        rebuildLocalCacheFromServer,
        clearLocalCacheAndReload,
        exportCurrentChannelsM3U,
        categoryStats
      }}
    >
      {children}
    </IPTVContext.Provider>
  );
};

export const useIPTV = () => {
  const context = useContext(IPTVContext);
  if (!context) {
    throw new Error('useIPTV must be used within an IPTVProviderComponent');
  }
  return context;
};

