/**
 * Stream Health Verification Utility
 * Checks stream URL availability and labels streams as 🟢 Actif, 🔴 Inactif, or 🟠 À vérifier
 */

export interface StreamHealthResult {
  channelId: string;
  status: 'Actif' | 'Inactif' | 'A_VERIFIER';
  statusCode?: number;
  latencyMs: number;
  errorMessage?: string;
  checkedAt: string;
}

/**
 * Tests an individual stream URL with non-blocking fetch / HEAD call
 */
export async function verifyStreamHealth(channelId: string, streamUrl: string): Promise<StreamHealthResult> {
  const startTime = Date.now();
  const checkedAt = new Date().toISOString();

  if (!streamUrl || typeof streamUrl !== 'string') {
    return {
      channelId,
      status: 'Inactif',
      latencyMs: 0,
      errorMessage: 'URL de flux manquante ou nulle',
      checkedAt
    };
  }

  // Handle known sample/video URLs or standard HTTP streams
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    let status: 'Actif' | 'Inactif' | 'A_VERIFIER' = 'Actif';
    let statusCode: number | undefined = undefined;
    let errorMessage: string | undefined = undefined;

    try {
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;
      
      // opacity/no-cors mode returns type 'opaque' with status 0, which means stream server is online and reached!
      return {
        channelId,
        status: latencyMs > 4000 ? 'A_VERIFIER' : 'Actif',
        statusCode: response.status || 200,
        latencyMs,
        checkedAt
      };
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      
      // If CORS or network error, mark as A_VERIFIER (needs verification inside video player)
      const latencyMs = Date.now() - startTime;
      if (fetchErr.name === 'AbortError') {
        return {
          channelId,
          status: 'Inactif',
          latencyMs,
          errorMessage: 'Délai d\'attente dépassé (Timeout > 6s)',
          checkedAt
        };
      }

      return {
        channelId,
        status: 'A_VERIFIER',
        latencyMs,
        errorMessage: 'Vérification limitée par la politique CORS (lecture directe requise)',
        checkedAt
      };
    }
  } catch (err: any) {
    return {
      channelId,
      status: 'A_VERIFIER',
      latencyMs: Date.now() - startTime,
      errorMessage: err.message || 'Erreur inconnue de vérification',
      checkedAt
    };
  }
}

/**
 * Runs batch health verification on multiple channels concurrently with a concurrency limit
 */
export async function batchVerifyStreams(
  channels: Array<{ id: string; streamUrl: string }>,
  onProgress?: (verifiedCount: number, total: number) => void
): Promise<Map<string, StreamHealthResult>> {
  const results = new Map<string, StreamHealthResult>();
  const total = channels.length;
  let completed = 0;

  // Process in chunks of 5 concurrent checks to prevent browser bottleneck
  const chunkSize = 5;
  for (let i = 0; i < channels.length; i += chunkSize) {
    const chunk = channels.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(c => verifyStreamHealth(c.id, c.streamUrl));
    const chunkResults = await Promise.all(chunkPromises);

    for (const res of chunkResults) {
      results.set(res.channelId, res);
      completed++;
    }

    if (onProgress) {
      onProgress(completed, total);
    }
  }

  return results;
}
