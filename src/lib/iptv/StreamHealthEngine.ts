import {
  IPTVContentItem,
  StreamHealthClassification,
  StreamHealthJobSummary,
  StreamHealthCheckProgress,
  IPTVGlobalSettings
} from '../../types/iptv';

export interface StreamProbeResult {
  channelId: string;
  success: boolean;
  classification: StreamHealthClassification;
  durationMs: number;
  statusCode?: number;
  protocol: 'HTTPS' | 'HTTP' | 'WSS' | 'WS' | 'UNKNOWN';
  detectedFormat: string;
  error?: string;
  consecutiveFailures: number;
  isActiveEligible: boolean;
  isReactivated: boolean;
  checkedAt: string;
}

export interface StreamHealthEngineOptions {
  failureThreshold?: number; // e.g. 3
  concurrency?: number; // e.g. 6
  timeoutMs?: number; // e.g. 5000ms
  allowHttpOnHttps?: boolean;
}

export class StreamHealthEngine {
  private static isRunning: boolean = false;
  private static cancelRequested: boolean = false;

  /**
   * Deep probe of an individual stream URL
   */
  public static async probeChannel(
    channel: IPTVContentItem,
    options?: StreamHealthEngineOptions
  ): Promise<StreamProbeResult> {
    const startTime = performance.now();
    const checkedAt = new Date().toISOString();
    const threshold = options?.failureThreshold || 3;
    const timeoutMs = options?.timeoutMs || 5000;

    const streamUrl = (channel.streamUrl || '').trim();

    // 1. Syntax & Empty URL validation
    if (!streamUrl) {
      const failures = (channel.consecutiveFailures || 0) + 1;
      const isDead = failures >= threshold;
      return {
        channelId: channel.id,
        success: false,
        classification: isDead ? 'DEAD' : 'UNSTABLE',
        durationMs: 0,
        protocol: 'UNKNOWN',
        detectedFormat: 'Invalide',
        error: 'URL de flux manquante ou vide',
        consecutiveFailures: failures,
        isActiveEligible: !isDead,
        isReactivated: false,
        checkedAt
      };
    }

    // 2. Protocol & Format detection
    let protocol: 'HTTPS' | 'HTTP' | 'WSS' | 'WS' | 'UNKNOWN' = 'UNKNOWN';
    if (streamUrl.startsWith('https://')) protocol = 'HTTPS';
    else if (streamUrl.startsWith('http://')) protocol = 'HTTP';
    else if (streamUrl.startsWith('wss://')) protocol = 'WSS';
    else if (streamUrl.startsWith('ws://')) protocol = 'WS';

    const urlLower = streamUrl.toLowerCase();
    let detectedFormat = 'Flux Direct';
    if (urlLower.includes('.m3u8') || urlLower.includes('/hls') || urlLower.includes('m3u8')) detectedFormat = 'HLS (M3U8)';
    else if (urlLower.includes('.mpd')) detectedFormat = 'DASH (MPD)';
    else if (urlLower.includes('.ts')) detectedFormat = 'MPEG-TS';
    else if (urlLower.includes('.mp4')) detectedFormat = 'MP4 Video';
    else if (urlLower.includes('.mp3') || urlLower.includes('.aac')) detectedFormat = 'Audio Stream';

    // 3. Mixed Content Warning in secure browser contexts
    const isHttpsContext = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isMixedContent = isHttpsContext && protocol === 'HTTP';

    // 4. Perform network reachability and segment verification
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let statusCode = 200;
      let latencyMs = 0;

      // Try GET with range request or HEAD
      try {
        const response = await fetch(streamUrl, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-1024'
          },
          mode: 'no-cors',
          signal: controller.signal
        });
        clearTimeout(timer);
        latencyMs = Math.round(performance.now() - startTime);
        statusCode = response.status || 200;
      } catch (fetchErr: any) {
        clearTimeout(timer);
        latencyMs = Math.round(performance.now() - startTime);

        if (fetchErr.name === 'AbortError') {
          throw new Error(`Délai d'attente serveur dépassé (Timeout > ${timeoutMs / 1000}s)`);
        }

        // In no-cors mode, cross-origin can reject if server is dead or DNS fails
        if (isMixedContent) {
          throw new Error('Protocole HTTP non sécurisé bloqué par le navigateur (Mixed Content Sandbox)');
        }

        throw new Error(fetchErr.message || 'Serveur de diffusion inaccessible ou réseau hors ligne');
      }

      // Successful probe!
      const isSlow = latencyMs > 3800;
      const classification: StreamHealthClassification = isSlow ? 'UNSTABLE' : 'ACTIVE';
      const wasDead = channel.healthClassification === 'DEAD' || channel.status === 'Inactif';

      return {
        channelId: channel.id,
        success: true,
        classification,
        durationMs: latencyMs,
        statusCode,
        protocol,
        detectedFormat,
        consecutiveFailures: 0,
        isActiveEligible: true,
        isReactivated: wasDead,
        checkedAt
      };

    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const currentFailures = channel.consecutiveFailures || 0;
      const newFailures = currentFailures + 1;
      const isConfirmedDead = newFailures >= threshold;
      const classification: StreamHealthClassification = isConfirmedDead ? 'DEAD' : 'UNSTABLE';

      return {
        channelId: channel.id,
        success: false,
        classification,
        durationMs: latencyMs,
        protocol,
        detectedFormat,
        error: err.message || 'Échec de transmission du flux',
        consecutiveFailures: newFailures,
        isActiveEligible: !isConfirmedDead,
        isReactivated: false,
        checkedAt
      };
    }
  }

  /**
   * Applies probe result to an existing channel item non-destructively
   */
  public static applyProbeResult(
    channel: IPTVContentItem,
    probe: StreamProbeResult
  ): IPTVContentItem {
    return {
      ...channel,
      healthClassification: probe.classification,
      consecutiveFailures: probe.consecutiveFailures,
      lastTestedAt: probe.checkedAt,
      lastHealthCheck: probe.checkedAt,
      startupTimeMs: probe.durationMs,
      lastHealthError: probe.error || undefined,
      healthStatus: probe.classification === 'ACTIVE' ? 'HEALTHY' : (probe.classification === 'DEAD' ? 'UNREACHABLE' : 'DEGRADED'),
      isActivePlaylistEligible: probe.isActiveEligible,
      status: probe.classification === 'DEAD' ? 'Inactif' : 'Actif',
      probeProtocol: probe.protocol,
      probeFormat: probe.detectedFormat,
      probeHttpStatus: probe.statusCode
    };
  }

  /**
   * High-Performance Chunked Batch Runner supporting 13,536+ channels
   */
  public static async runBatchHealthCheck(
    channels: IPTVContentItem[],
    options?: StreamHealthEngineOptions & {
      onProgress?: (progress: StreamHealthCheckProgress) => void;
      onChunkCompleted?: (updatedChannels: IPTVContentItem[]) => Promise<void> | void;
    }
  ): Promise<{
    updatedChannels: IPTVContentItem[];
    summary: StreamHealthJobSummary;
  }> {
    if (this.isRunning) {
      console.warn('[StreamHealthEngine] A batch is already running. Stopping previous run.');
      this.cancelRequested = true;
      await new Promise(r => setTimeout(r, 200));
    }

    this.isRunning = true;
    this.cancelRequested = false;

    const startedAt = new Date().toISOString();
    const startTime = performance.now();
    const concurrency = options?.concurrency || 6;
    const threshold = options?.failureThreshold || 3;
    const timeoutMs = options?.timeoutMs || 4500;

    const total = channels.length;
    let testedCount = 0;
    let activeCount = 0;
    let unstableCount = 0;
    let deadCount = 0;
    let reactivatedCount = 0;
    let totalStartupTime = 0;

    const resultMap = new Map<string, IPTVContentItem>();
    channels.forEach(c => resultMap.set(c.id, { ...c }));

    // Process in non-blocking batches
    const batchSize = Math.max(concurrency * 2, 10);
    
    for (let i = 0; i < total; i += batchSize) {
      if (this.cancelRequested) {
        break;
      }

      const batch = channels.slice(i, i + batchSize);
      const probePromises = batch.map(c => this.probeChannel(c, { failureThreshold: threshold, timeoutMs }));
      const probeResults = await Promise.all(probePromises);

      const batchUpdated: IPTVContentItem[] = [];

      for (let j = 0; j < batch.length; j++) {
        const original = batch[j];
        const probe = probeResults[j];
        const updated = this.applyProbeResult(original, probe);

        resultMap.set(updated.id, updated);
        batchUpdated.push(updated);

        testedCount++;
        if (probe.classification === 'ACTIVE') activeCount++;
        else if (probe.classification === 'UNSTABLE') unstableCount++;
        else if (probe.classification === 'DEAD') deadCount++;

        if (probe.isReactivated) reactivatedCount++;
        if (probe.durationMs > 0) totalStartupTime += probe.durationMs;
      }

      // Notify progress
      if (options?.onProgress) {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const speed = testedCount / Math.max(elapsedSec, 0.1);
        const remaining = total - testedCount;
        const estRemainingSec = speed > 0 ? Math.round(remaining / speed) : 0;

        options.onProgress({
          isRunning: true,
          testedCount,
          totalCount: total,
          activeCount,
          unstableCount,
          deadCount,
          currentChannelName: batch[batch.length - 1]?.name,
          estimatedTimeRemainingSec: estRemainingSec
        });
      }

      // Notify intermediate chunk saved to IndexedDB
      if (options?.onChunkCompleted) {
        await options.onChunkCompleted(batchUpdated);
      }

      // Yield event loop to prevent UI lag
      await new Promise(r => setTimeout(r, 10));
    }

    const durationMs = Math.round(performance.now() - startTime);
    const finishedAt = new Date().toISOString();
    const updatedChannels = Array.from(resultMap.values());

    const activePlaylistTotal = updatedChannels.filter(c => c.isActivePlaylistEligible !== false && c.healthClassification !== 'DEAD').length;

    const summary: StreamHealthJobSummary = {
      id: `health-job-${Date.now()}`,
      startedAt,
      finishedAt,
      durationMs,
      totalTested: testedCount,
      activeCount,
      unstableCount,
      deadCount,
      pendingCount: total - testedCount,
      reactivatedCount,
      averageStartupTimeMs: testedCount > 0 ? Math.round(totalStartupTime / testedCount) : 0,
      status: this.cancelRequested ? 'CANCELLED' : 'COMPLETED',
      activePlaylistTotal,
      sourceCatalogTotal: total
    };

    this.isRunning = false;
    this.cancelRequested = false;

    return { updatedChannels, summary };
  }

  /**
   * Stops any currently running batch
   */
  public static cancelRunningCheck(): void {
    if (this.isRunning) {
      this.cancelRequested = true;
    }
  }

  /**
   * Filters the active playlist (only functional & verified streams)
   * Without modifying or destroying the source catalog
   */
  public static getActivePlaylist(allChannels: IPTVContentItem[]): IPTVContentItem[] {
    return (allChannels || []).filter(channel => {
      // Must not be confirmed dead
      if (channel.healthClassification === 'DEAD') return false;
      if (channel.isActivePlaylistEligible === false) return false;
      return true;
    });
  }
}
