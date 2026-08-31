import { IPTVContentType } from '../../types/iptv';
import { normalizeIPTVCategory } from './categoryNormalizer';
import { getApiUrl } from '../api';

export interface ParsedM3UChannel {
  id: string;
  name: string;
  streamUrl: string;
  logoUrl: string;
  groupTitle: string;
  category?: string;
  rawCategory?: string;
  tvgId?: string;
  tvgName?: string;
  country: string;
  language: string;
  quality: string;
  type: IPTVContentType;
  currentProgram?: string;
  nextProgram?: string;
}

export interface M3UParseResult {
  playlistName?: string;
  epgUrl?: string;
  channels: ParsedM3UChannel[];
  categories: string[];
  totalParsed: number;
  invalidCount: number;
  errors: string[];
}

/**
 * Sanitizes stream URLs to prevent XSS, script injection or unsafe protocols
 */
export function sanitizeStreamUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (trimmed.length < 7) return null;
  
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('rtmp://') ||
    lower.startsWith('rtsp://')
  ) {
    return trimmed;
  }
  
  return null;
}

/**
 * Determines stream type based on category, extensions or group tags
 * Ensures strict separation between Live (TV, Radio, Events) and VOD (Movies, Series, etc.)
 */
export function inferChannelType(name: string, group: string, streamUrl: string): IPTVContentType {
  const combined = `${name} ${group}`.toLowerCase();
  const urlLower = streamUrl.toLowerCase();
  
  // 1. RADIO (Live)
  if (
    combined.includes('radio') || 
    combined.includes('fm') || 
    urlLower.includes('/radio/') ||
    urlLower.endsWith('.mp3') || 
    urlLower.endsWith('.aac') ||
    combined.includes('webradio') ||
    combined.includes('audio direct')
  ) {
    return 'RADIO';
  }

  // 2. DIRECT EVENTS (Live)
  if (
    combined.includes('évènement') || 
    combined.includes('evenement') || 
    combined.includes('event') || 
    combined.includes('ppv') || 
    combined.includes('direct live') ||
    combined.includes('live match')
  ) {
    return 'DIRECT_EVENT';
  }

  // 3. SERIES (VOD)
  if (
    combined.includes('series') || 
    combined.includes('série') || 
    urlLower.includes('/series/') ||
    combined.includes('saison') ||
    combined.includes('episode') ||
    combined.includes('épiosde') ||
    /s\d{2}e\d{2}/i.test(combined)
  ) {
    return 'SERIES';
  }

  // 4. DESSIN ANIME / JEUNESSE (VOD if they are movies/episodes, but often categorized as VOD in IPTV lists)
  // If the URL looks like a static file and it's in a kids category, it's VOD.
  if (
    (combined.includes('dessin animé') || combined.includes('dessin anime') || combined.includes('cartoon') || combined.includes('animation')) &&
    (urlLower.includes('/movie/') || urlLower.includes('/series/') || urlLower.endsWith('.mp4') || urlLower.endsWith('.mkv'))
  ) {
    return 'DESSIN_ANIME';
  }

  // 5. DOCUMENTAIRE (VOD)
  if (
    (combined.includes('docu') || combined.includes('documentaire') || combined.includes('reportage')) &&
    (urlLower.includes('/movie/') || urlLower.endsWith('.mp4') || urlLower.endsWith('.mkv'))
  ) {
    return 'DOCUMENTAIRE';
  }

  // 6. FILM / CINEMA (VOD)
  if (
    combined.includes('movie') || 
    combined.includes('film') || 
    combined.includes('vod') || 
    combined.includes('cinéma') ||
    combined.includes('cinema') ||
    urlLower.includes('/movie/') ||
    urlLower.endsWith('.mp4') ||
    urlLower.endsWith('.mkv') ||
    urlLower.endsWith('.avi')
  ) {
    return 'FILM';
  }
  
  // Default: TV (Live)
  return 'TV';
}

/**
 * Infer Country from name or group title
 */
function inferCountry(name: string, groupTitle: string, rawCountry?: string): string {
  if (rawCountry && rawCountry.trim().length > 0) return rawCountry.trim();

  const combined = `${name} ${groupTitle}`.toLowerCase();
  
  if (combined.includes('ci') || combined.includes("côte d'ivoire") || combined.includes('ivoire') || combined.includes('rti') || combined.includes('nci')) {
    return "Côte d'Ivoire";
  }
  if (combined.includes('france') || combined.includes('fr') || combined.includes('tf1') || combined.includes('m6')) {
    return 'France';
  }
  if (combined.includes('sénégal') || combined.includes('senegal') || combined.includes('sn') || combined.includes('2s')) {
    return 'Sénégal';
  }
  if (combined.includes('mali') || combined.includes('ml') || combined.includes('ortm')) {
    return 'Mali';
  }
  if (combined.includes('cameroun') || combined.includes('cameroon') || combined.includes('crtv')) {
    return 'Cameroun';
  }
  if (combined.includes('afrique') || combined.includes('africa') || combined.includes('canal+ africa')) {
    return 'Afrique';
  }
  
  return 'International';
}

/**
 * Normalizes Group / Category
 */
function normalizeCategory(rawGroup?: string, type?: string): string {
  if (!rawGroup || !rawGroup.trim()) {
    if (type === 'RADIO') return 'Radio Local';
    if (type === 'FILM') return 'Cinéma';
    return 'Divertissement';
  }

  const group = rawGroup.trim();
  const lower = group.toLowerCase();

  if (lower.includes('news') || lower.includes('actu') || lower.includes('info')) return 'Actualités';
  if (lower.includes('sport')) return 'Sport';
  if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema')) return 'Cinéma';
  if (lower.includes('music') || lower.includes('musique')) return 'Musique';
  if (lower.includes('kids') || lower.includes('enfant') || lower.includes('jeunesse') || lower.includes('cartoon')) return 'Jeunesse';
  if (lower.includes('docu')) return 'Documentaires';
  if (lower.includes('culture') || lower.includes('art')) return 'Culture';
  if (lower.includes('relig') || lower.includes('islam') || lower.includes('chretien') || lower.includes('church')) return 'Religion';
  if (lower.includes('radio') || lower.includes('fm')) return 'Radio Local';

  return group;
}

/**
 * Default fallback logo generator if channel logo is missing or broken
 */
function getFallbackLogo(name: string, category: string): string {
  const encodedName = encodeURIComponent(name.slice(0, 10));
  return `https://ui-avatars.com/api/?name=${encodedName}&background=f97316&color=ffffff&bold=true&size=128`;
}

/**
 * Full M3U / M3U8 string parser - Optimized for high-speed batch processing
 */
export function parseM3UContent(m3uString: string, playlistNameFallback: string = 'Playlist Importée'): M3UParseResult {
  const lines = m3uString.split(/\r?\n/);
  const channels: ParsedM3UChannel[] = [];
  const categoriesSet = new Set<string>();
  const errors: string[] = [];
  
  let epgUrl: string | undefined = undefined;
  let invalidCount = 0;
  
  let currentInfo: {
    tvgId?: string;
    tvgName?: string;
    tvgLogo?: string;
    groupTitle?: string;
    tvgCountry?: string;
    tvgLanguage?: string;
    name?: string;
  } | null = null;

  const timestampPrefix = Date.now();
  const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Header line check
    if (line.startsWith('#EXTM3U')) {
      const epgMatch = line.match(/x-tvg-url="([^"]+)"/i) || line.match(/url-tvg="([^"]+)"/i);
      if (epgMatch) {
        epgUrl = sanitizeStreamUrl(epgMatch[1]) || undefined;
      }
      continue;
    }

    // Channel metadata line
    if (line.startsWith('#EXTINF:')) {
      currentInfo = {};

      // Fast single-pass attribute extractor
      attrRegex.lastIndex = 0;
      let match;
      while ((match = attrRegex.exec(line)) !== null) {
        const key = match[1].toLowerCase();
        const val = match[2];
        if (key === 'tvg-id') currentInfo.tvgId = val;
        else if (key === 'tvg-name') currentInfo.tvgName = val;
        else if (key === 'tvg-logo') currentInfo.tvgLogo = val;
        else if (key === 'group-title') currentInfo.groupTitle = val;
        else if (key === 'tvg-country') currentInfo.tvgCountry = val;
        else if (key === 'tvg-language') currentInfo.tvgLanguage = val;
      }

      // Extract channel name (text after the last comma)
      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        currentInfo.name = line.slice(commaIndex + 1).trim();
      } else {
        currentInfo.name = currentInfo.tvgName || currentInfo.tvgId || 'Chaîne Inconnue';
      }
      continue;
    }

    // Ignore comment lines
    if (line.startsWith('#')) {
      continue;
    }

    // Stream URL line
    const sanitizedUrl = sanitizeStreamUrl(line);
    if (sanitizedUrl) {
      const channelName = currentInfo?.name || currentInfo?.tvgName || `Chaîne #${channels.length + 1}`;
      const rawGroupTitle = currentInfo?.groupTitle || '';
      const channelType = inferChannelType(channelName, rawGroupTitle, sanitizedUrl);
      const category = normalizeIPTVCategory(rawGroupTitle, channelName, channelType, sanitizedUrl);
      const country = inferCountry(channelName, rawGroupTitle, currentInfo?.tvgCountry);
      const language = currentInfo?.tvgLanguage || 'Français';
      
      const logoUrl = currentInfo?.tvgLogo && currentInfo.tvgLogo.startsWith('http')
        ? currentInfo.tvgLogo
        : getFallbackLogo(channelName, category);

      categoriesSet.add(category);

      channels.push({
        id: `ch-${timestampPrefix}-${i}`,
        name: channelName,
        streamUrl: sanitizedUrl,
        logoUrl,
        groupTitle: rawGroupTitle || category,
        rawCategory: rawGroupTitle,
        category,
        tvgId: currentInfo?.tvgId,
        tvgName: currentInfo?.tvgName,
        country,
        language,
        quality: sanitizedUrl.includes('.m3u8') ? '1080p Full HD' : 'HD 720p',
        type: channelType
      });

      // Reset info for next item
      currentInfo = null;
    } else if (line.length > 5) {
      invalidCount++;
      if (errors.length < 20) {
        errors.push(`URL de flux invalide ou non sécurisée rejetée: ${line.slice(0, 50)}...`);
      }
    }
  }

  return {
    playlistName: playlistNameFallback,
    epgUrl,
    channels,
    categories: Array.from(categoriesSet),
    totalParsed: channels.length,
    invalidCount,
    errors
  };
}

/**
 * Normalizes a stream URL for reliable deduplication (trims, standardizes protocol, strips transient tokens)
 */
export function normalizeStreamUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Remove temporary query tracking params like ?token=... or ?t=... if present while preserving essential stream params
  try {
    const parsed = new URL(cleaned);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return cleaned;
  }
}

/**
 * Generates a canonical fingerprint slug from name, country, and type
 */
export function generateChannelSlug(name: string, country: string, type: string): string {
  const normName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCountry = (country || 'ci').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normType = (type || 'tv').toLowerCase();
  return `${normName}__${normCountry}__${normType}`;
}

export interface DeduplicationResult {
  uniqueChannels: ParsedM3UChannel[];
  duplicateCount: number;
  duplicateDetails: Array<{
    name: string;
    streamUrl: string;
    reason: 'STREAM_URL_COLLISION' | 'TVG_ID_COLLISION' | 'SIGNATURE_MATCH';
  }>;
}

/**
 * Smart Multi-criteria Deduplication Engine
 * Identifies duplicate streams across playlists using 3 complementary vectors:
 * 1. Normalized Stream URL
 * 2. Standardized TVG-ID (when available)
 * 3. Canonical Fingerprint Slug (Name + Country + Type)
 */
export function smartDeduplicateChannels(
  incomingChannels: ParsedM3UChannel[],
  existingChannels: Array<{ streamUrl: string; tvgId?: string; name: string; country?: string; type?: string }> = []
): DeduplicationResult {
  const seenUrls = new Set<string>();
  const seenTvgIds = new Set<string>();
  const seenSlugs = new Set<string>();

  // Index existing channels
  existingChannels.forEach((c) => {
    if (c.streamUrl) seenUrls.add(normalizeStreamUrl(c.streamUrl));
    if (c.tvgId && c.tvgId.trim().length > 1) seenTvgIds.add(c.tvgId.trim().toLowerCase());
    if (c.name) seenSlugs.add(generateChannelSlug(c.name, c.country || "Côte d'Ivoire", c.type || 'TV'));
  });

  const uniqueChannels: ParsedM3UChannel[] = [];
  const duplicateDetails: Array<{
    name: string;
    streamUrl: string;
    reason: 'STREAM_URL_COLLISION' | 'TVG_ID_COLLISION' | 'SIGNATURE_MATCH';
  }> = [];

  incomingChannels.forEach((ch) => {
    const normUrl = normalizeStreamUrl(ch.streamUrl);
    const normTvgId = ch.tvgId ? ch.tvgId.trim().toLowerCase() : null;
    const slug = generateChannelSlug(ch.name, ch.country, ch.type);

    if (seenUrls.has(normUrl)) {
      duplicateDetails.push({
        name: ch.name,
        streamUrl: ch.streamUrl,
        reason: 'STREAM_URL_COLLISION'
      });
      return;
    }

    if (normTvgId && seenTvgIds.has(normTvgId)) {
      duplicateDetails.push({
        name: ch.name,
        streamUrl: ch.streamUrl,
        reason: 'TVG_ID_COLLISION'
      });
      return;
    }

    if (seenSlugs.has(slug) && slug.length > 5) {
      duplicateDetails.push({
        name: ch.name,
        streamUrl: ch.streamUrl,
        reason: 'SIGNATURE_MATCH'
      });
      return;
    }

    // Mark as seen
    seenUrls.add(normUrl);
    if (normTvgId) seenTvgIds.add(normTvgId);
    seenSlugs.add(slug);

    uniqueChannels.push(ch);
  });

  return {
    uniqueChannels,
    duplicateCount: duplicateDetails.length,
    duplicateDetails
  };
}

/**
 * Fetch and parse remote M3U URL with fast timeout, backend proxy fallback, and CORS proxy
 */
export async function fetchAndParseM3UUrl(url: string, playlistName: string): Promise<M3UParseResult> {
  const sanitizedUrl = sanitizeStreamUrl(url);
  if (!sanitizedUrl) {
    throw new Error("L'URL M3U fournie est invalide ou non sécurisée (doit commencer par http:// ou https://).");
  }

  let responseText = '';

  // 1. Try local server-side proxy route first (bypasses browser CORS & network restrictions)
  try {
    const serverProxyRes = await fetch(getApiUrl('/api/iptv/m3u/parse-proxy'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sanitizedUrl, playlistName })
    });
    if (serverProxyRes.ok) {
      const json = await serverProxyRes.json();
      if (json && json.channels && json.channels.length > 0) {
        return json as M3UParseResult;
      }
    }
  } catch {
    // Proceed to browser fallback if backend endpoint not responding
  }

  // 2. Direct fetch with abort controller (4 sec timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(sanitizedUrl, {
      method: 'GET',
      headers: { 'Accept': 'text/plain, application/x-mpegurl, */*' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      responseText = await res.text();
    }
  } catch (directErr) {
    console.warn("Direct fetch for M3U failed or timed out, trying fallback proxies...", directErr);
  }

  // 3. Public CORS proxy fallback with abort controller (6 sec timeout)
  if (!responseText) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(sanitizedUrl)}`;
      const proxyRes = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (!proxyRes.ok) {
        throw new Error(`Impossible de télécharger la playlist depuis la source (${proxyRes.status} ${proxyRes.statusText}).`);
      }
      responseText = await proxyRes.text();
    } catch (proxyErr: any) {
      throw new Error(`Échec de récupération M3U: ${proxyErr.message || 'Serveur distant hors-ligne'}`);
    }
  }

  if (!responseText || (!responseText.includes('#EXTM3U') && responseText.length < 20)) {
    throw new Error("Le contenu téléchargé ne semble pas être un fichier M3U/M3U8 valide.");
  }

  return parseM3UContent(responseText, playlistName);
}
