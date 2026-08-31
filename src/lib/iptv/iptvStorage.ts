import { IPTVContentItem, IPTVPlaylist } from '../../types/iptv';
import { getApiUrl } from '../api';

const DB_NAME = 'ivoirexpress_iptv_db';
const DB_VERSION = 1;
const CHANNELS_STORE = 'channels';
const PLAYLISTS_STORE = 'playlists';
const METADATA_STORE = 'metadata';

/**
 * Initializes or opens the IndexedDB instance for high-capacity IPTV storage (supporting 50,000+ channels)
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CHANNELS_STORE)) {
        const channelStore = db.createObjectStore(CHANNELS_STORE, { keyPath: 'id' });
        channelStore.createIndex('category', 'category', { unique: false });
        channelStore.createIndex('type', 'type', { unique: false });
        channelStore.createIndex('country', 'country', { unique: false });
        channelStore.createIndex('playlistId', 'playlistId', { unique: false });
        channelStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
        db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Saves channels in bulk to IndexedDB in efficient transactions
 */
export async function saveChannelsToIndexedDB(channels: IPTVContentItem[]): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHANNELS_STORE], 'readwrite');
      const store = transaction.objectStore(CHANNELS_STORE);

      // Write in chunks for high throughput
      for (const channel of channels) {
        store.put(channel);
      }

      transaction.oncomplete = () => {
        resolve(true);
      };

      transaction.onerror = () => {
        console.warn('[IPTV Storage] Transaction failed:', transaction.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn('[IPTV Storage] IndexedDB write error, falling back:', err);
    return false;
  }
}

/**
 * Loads all channels from IndexedDB
 */
export async function loadChannelsFromIndexedDB(): Promise<IPTVContentItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([CHANNELS_STORE], 'readonly');
      const store = transaction.objectStore(CHANNELS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as IPTVContentItem[]) || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Saves playlists in bulk to IndexedDB
 */
export async function savePlaylistsToIndexedDB(playlists: IPTVPlaylist[]): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYLISTS_STORE);

      for (const pl of playlists) {
        store.put(pl);
      }

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Loads all playlists from IndexedDB
 */
export async function loadPlaylistsFromIndexedDB(): Promise<IPTVPlaylist[]> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([PLAYLISTS_STORE], 'readonly');
      const store = transaction.objectStore(PLAYLISTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as IPTVPlaylist[]) || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a single channel from IndexedDB
 */
export async function deleteChannelFromIndexedDB(channelId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([CHANNELS_STORE], 'readwrite');
    transaction.objectStore(CHANNELS_STORE).delete(channelId);
  } catch (err) {
    console.warn('[IPTV Storage] Error deleting channel from IndexedDB:', err);
  }
}

/**
 * Delete a playlist and all its associated channels from IndexedDB
 */
export async function deletePlaylistFromIndexedDB(playlistId: string): Promise<void> {
  try {
    const db = await getDB();
    const transaction = db.transaction([CHANNELS_STORE, PLAYLISTS_STORE], 'readwrite');
    
    // Delete playlist
    transaction.objectStore(PLAYLISTS_STORE).delete(playlistId);
    
    // Delete associated channels using index
    const channelStore = transaction.objectStore(CHANNELS_STORE);
    const index = channelStore.index('playlistId');
    const request = index.getAllKeys(playlistId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => channelStore.delete(key));
    };
  } catch (err) {
    console.warn('[IPTV Storage] Error deleting playlist from IndexedDB:', err);
  }
}

/**
 * Completely clears the local channels cache from IndexedDB
 */
export async function clearLocalChannelsCache(): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([CHANNELS_STORE], 'readwrite');
      const store = transaction.objectStore(CHANNELS_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Counts the exact number of channels currently stored in IndexedDB
 */
export async function countIndexedDBRecords(): Promise<{ channelsCount: number; playlistsCount: number }> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([CHANNELS_STORE, PLAYLISTS_STORE], 'readonly');
      const channelStore = transaction.objectStore(CHANNELS_STORE);
      const playlistStore = transaction.objectStore(PLAYLISTS_STORE);

      const chCountReq = channelStore.count();
      const plCountReq = playlistStore.count();

      let chCount = 0;
      let plCount = 0;

      chCountReq.onsuccess = () => {
        chCount = chCountReq.result;
      };

      plCountReq.onsuccess = () => {
        plCount = plCountReq.result;
      };

      transaction.oncomplete = () => {
        resolve({ channelsCount: chCount, playlistsCount: plCount });
      };

      transaction.onerror = () => {
        resolve({ channelsCount: 0, playlistsCount: 0 });
      };
    });
  } catch {
    return { channelsCount: 0, playlistsCount: 0 };
  }
}

/**
 * Replaces the entire local channels store with a freshly verified collection from Firestore
 */
export async function rebuildChannelsInIndexedDB(channels: IPTVContentItem[]): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CHANNELS_STORE], 'readwrite');
      const store = transaction.objectStore(CHANNELS_STORE);

      // 1. Clear store
      store.clear();

      // 2. Put fresh channels in batch
      for (const channel of channels) {
        store.put(channel);
      }

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    console.warn('[IPTV Storage] rebuild error:', e);
    return false;
  }
}

/**
 * Exports channels array to valid M3U string for backup
 */
export function exportChannelsToM3U(channels: IPTVContentItem[], playlistTitle = 'Exportation_IVOIREXPRESS_IPTV'): string {
  let m3u = `#EXTM3U x-tvg-url="${getApiUrl('/api/iptv/epg/guide.xml')}"\n`;
  m3u += `#PLAYLIST:${playlistTitle}\n\n`;

  for (const c of channels) {
    const tvgId = c.id || '';
    const tvgName = c.name.replace(/"/g, "'");
    const tvgLogo = c.logoUrl || '';
    const groupTitle = c.category || 'Général';
    const country = c.country || "Côte d'Ivoire";
    const language = c.language || 'Français';

    m3u += `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${tvgLogo}" group-title="${groupTitle}" tvg-country="${country}" tvg-language="${language}",${c.name}\n`;
    m3u += `${c.streamUrl}\n\n`;
  }

  return m3u;
}
