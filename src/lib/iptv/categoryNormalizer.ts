/**
 * IVOIReXpress IPTV - Category Normalization & Multi-Criteria Filtering Engine
 * 
 * Provides robust, non-destructive normalization for IPTV categories across
 * diverse international M3U/M3U8 playlists (e.g. "MUSIC", "FR | MUSIQUE", "Trace", "Musique HD").
 * Preserves raw source attributes (group-title, category, genre) while guaranteeing
 * canonical classification, dynamic counts, and deep multi-criteria filtering.
 */

import { IPTVContentItem, IPTVCategory } from '../../types/iptv';

export interface CanonicalCategoryDefinition {
  id: string;
  name: IPTVCategory | string;
  icon: string;
  aliases: string[];
  keywords: string[];
  description: string;
}

/**
 * Standard Canonical Categories with extensive aliases, language variations, and keywords
 */
export const CANONICAL_CATEGORIES: CanonicalCategoryDefinition[] = [
  {
    id: 'musique',
    name: 'Musique',
    icon: '🎵',
    aliases: [
      'music', 'musique', 'musiques', 'musical', 'musicale', 'musicals',
      'clips', 'clip', 'chanson', 'chansons', 'radio music', 'music tv',
      'fr - musique', 'fr: musique', 'fr|musique', 'fr | musique', 'fr::musique',
      'us - music', 'us: music', 'us|music', 'uk - music',
      'afro music', 'africa music', 'musique africaine', 'urban music',
      'trace', 'mtv', 'afrobeats', 'coupe decale', 'zouglou', 'amapiano', 'hit'
    ],
    keywords: [
      'music', 'musique', 'clip', 'trace', 'mtv', 'hit', 'sound', 'melody',
      'afrobeats', 'zouglou', 'chanson', 'concert', 'audio', 'beats', 'mezzo',
      'nrj', 'skyrock', 'nostalgie', 'radio'
    ],
    description: 'Chaînes musicales, clips vidéo, concerts en direct et radios'
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: '⚽',
    aliases: [
      'sport', 'sports', 'sportif', 'sportive', 'football', 'soccer',
      'fr - sport', 'fr: sport', 'fr|sport', 'fr | sport', 'fr::sport',
      'us - sport', 'uk - sports', 'bein', 'espn', 'eurosport', 'supersport',
      'canal+ sport', 'canal sport', 'canal sports', 'rmc sport', 'dazn'
    ],
    keywords: [
      'sport', 'football', 'soccer', 'nba', 'tennis', 'can', 'ligue 1',
      'champions league', 'combat', 'mma', 'ufc', 'rugby', 'bein', 'espn',
      'eurosport', 'stade', 'athletisme', 'golf', 'moto', 'f1'
    ],
    description: 'Football, basketball, grands tournois et compétitions en direct'
  },
  {
    id: 'actualites',
    name: 'Actualités',
    icon: '📰',
    aliases: [
      'actualites', 'actualités', 'news', 'info', 'infos', 'information',
      'informations', 'actu', 'actus', 'journal', 'presse',
      'fr - news', 'fr: news', 'fr|news', 'fr | actualites', 'fr - info',
      'france 24', 'bfm', 'cnews', 'lci', 'euronews', 'cnn', 'bbc news', 'al jazeera'
    ],
    keywords: [
      'news', 'info', 'actu', 'journal', 'jt', 'presse', '24h', 'direct info',
      'france24', 'france 24', 'bfm', 'cnews', 'lci', 'euronews', 'al jazeera',
      'cnn', 'bbc', 'afrique media', 'rti 1', 'nci'
    ],
    description: 'Journaux télévisés, direct info continue et débats de société'
  },
  {
    id: 'cinema',
    name: 'Cinéma',
    icon: '🎬',
    aliases: [
      'cinema', 'cinéma', 'movie', 'movies', 'film', 'films', 'vod',
      'fr - cinema', 'fr: cinema', 'fr|cinema', 'fr | cinema', 'fr - films',
      'canal+ cinema', 'cine+', 'cine', 'action', 'thriller', 'hollywood', 'nollywood'
    ],
    keywords: [
      'cinema', 'movie', 'film', 'cine', 'hollywood', 'nollywood', 'box office',
      'blockbuster', 'action', 'thriller', 'drame', 'comedie', 'a+ ivoire'
    ],
    description: 'Longs métrages, classiques du cinéma, films africains et internationaux'
  },
  {
    id: 'series',
    name: 'Séries',
    icon: '🍿',
    aliases: [
      'series', 'séries', 'serie', 'série', 'tv shows', 'feuilleton', 'novelas',
      'telenovelas', 'soap', 'a+ series', 'canal+ series', 'canal series'
    ],
    keywords: [
      'series', 'serie', 'telenovela', 'novelas', 'feuilleton', 'saison', 'episode'
    ],
    description: 'Séries africaines cultes, télénovelas et productions originales'
  },
  {
    id: 'jeunesse',
    name: 'Jeunesse',
    icon: '🎨',
    aliases: [
      'jeunesse', 'kids', 'enfant', 'enfants', 'cartoons', 'cartoon', 'anime',
      'animation', 'dessin anime', 'dessins animés', 'junior',
      'fr - jeunesse', 'fr: kids', 'gulli', 'disney', 'nickelodeon', 'cartoon network',
      'tiptok', 'boomerang'
    ],
    keywords: [
      'kid', 'enfant', 'cartoon', 'disney', 'gulli', 'animation', 'anime', 'nickelodeon',
      'jeunesse', 'manga', 'junior', 'bebe', 'baby'
    ],
    description: 'Dessins animés, programmes éducatifs et divertissements pour enfants'
  },
  {
    id: 'documentaires',
    name: 'Documentaires',
    icon: '🌍',
    aliases: [
      'documentaires', 'documentaire', 'docs', 'docu', 'documentary', 'decouverte',
      'découverte', 'science', 'histoire', 'nature', 'animaux',
      'national geographic', 'discovery', 'planete+', 'arte', 'voyage'
    ],
    keywords: [
      'docu', 'documentaire', 'decouverte', 'science', 'histoire', 'nature',
      'geography', 'nat geo', 'discovery', 'animal', 'faune', 'planete', 'archeo'
    ],
    description: 'Reportages, découvertes scientifiques, histoire et faune sauvage'
  },
  {
    id: 'culture',
    name: 'Culture',
    icon: '🎭',
    aliases: [
      'culture', 'culturel', 'culturelle', 'art', 'arts', 'education', 'éducation',
      'theatre', 'théâtre', 'patrimoine', 'tradition'
    ],
    keywords: [
      'culture', 'art', 'theatre', 'patrimoine', 'tradition', 'education', 'danse',
      'baoule', 'bete', 'senoufo', 'ivoire culture'
    ],
    description: 'Arts vivants, patrimoine culturel ivoirien et traditions africaines'
  },
  {
    id: 'religion',
    name: 'Religion',
    icon: '🕊️',
    aliases: [
      'religion', 'religieux', 'religieuse', 'foi', 'chretien', 'chrétien', 'chretienne',
      'islam', 'islamique', 'muslim', 'coran', 'bible', 'church', 'eglise', 'gospel',
      'al bayane', 'emci', 'ktotv', 'sanctuaire'
    ],
    keywords: [
      'relig', 'islam', 'chretien', 'church', 'eglise', 'gospel', 'coran', 'bible',
      'priere', 'al bayane', 'emci', 'kto', 'catholique', 'evangelique', 'mosquee'
    ],
    description: 'Chaînes religieuses, enseignements spirituels, culte et médiations'
  },
  {
    id: 'divertissement',
    name: 'Divertissement',
    icon: '✨',
    aliases: [
      'divertissement', 'entertainment', 'generaliste', 'généraliste', 'general',
      'varietes', 'variétés', 'humour', 'talk show', 'tele realite', 'télé réalité',
      'fr - general', 'chaine nationale', 'nationales', 'canal+'
    ],
    keywords: [
      'divertiss', 'entertain', 'general', 'variete', 'humour', 'talk', 'mag',
      'gohou', 'show', 'rti', 'nci', 'life tv', 'c8', 'm6', 'tf1', 'france 2'
    ],
    description: 'Talk-shows, télé-réalité, émissions de variétés et humour'
  },
  {
    id: 'radio_local',
    name: 'Radio Local',
    icon: '📻',
    aliases: [
      'radio local', 'radio', 'radios', 'fm', 'webradio', 'station radio',
      'radio ci', 'radio ivoire', 'radio france', 'radio afrique', 'rfi', 'bbc afrique'
    ],
    keywords: [
      'radio', 'fm', 'webradio', 'station', 'audio direct', 'rfi', 'onuci fm',
      'nostalgie', 'al bayane fm', 'trace fm', 'jam', 'hit radio'
    ],
    description: 'Stations radios FM ivoiriennes et internationales en streaming direct'
  },
  {
    id: 'international',
    name: 'International',
    icon: '🌐',
    aliases: [
      'international', 'monde', 'world', 'etranger', 'foreign', 'global',
      'afrique', 'europe', 'asie', 'amerique', 'mena'
    ],
    keywords: [
      'international', 'monde', 'world', 'global', 'satellite', 'afrique'
    ],
    description: 'Grandes chaînes internationales et programmes du monde entier'
  }
];

export const CANONICAL_CATEGORY_NAMES: string[] = CANONICAL_CATEGORIES.map((c) => String(c.name));

/**
 * Fast lookup map for normalized category aliases
 */
const ALIAS_LOOKUP_MAP = new Map<string, string>();
CANONICAL_CATEGORIES.forEach((cat) => {
  // Add direct canonical name
  ALIAS_LOOKUP_MAP.set(cat.name.toLowerCase().trim(), cat.name);
  ALIAS_LOOKUP_MAP.set(cat.id.toLowerCase().trim(), cat.name);

  // Add all aliases
  cat.aliases.forEach((alias) => {
    ALIAS_LOOKUP_MAP.set(alias.toLowerCase().trim(), cat.name);
  });
});

/**
 * Clean and strip prefix tags like "FR - ", "US | ", "[HD] ", "::: "
 */
export function cleanRawCategoryString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();

  // Remove surrounding brackets or quotes
  cleaned = cleaned.replace(/^["'\[\(]+|["'\]\)]+$/g, '').trim();

  // Remove country prefix patterns like "FR - ", "FR : ", "FR | ", "UK::", "US - ", "AFRICA - "
  cleaned = cleaned.replace(/^[A-Za-z0-9\s]{2,10}\s*[\-\|:\/]\s*/i, '').trim();

  return cleaned;
}

/**
 * High-precision Canonical Category Normalizer.
 * Maps any raw category, group-title, or channel metadata to a standardized canonical category.
 * If no close match is found, returns the cleaned original title.
 */
export function normalizeIPTVCategory(
  rawCategory?: string,
  channelName?: string,
  channelType?: string,
  streamUrl?: string
): string {
  const combinedRaw = (rawCategory || '').trim();
  const lowerRaw = combinedRaw.toLowerCase();

  // 1. Direct Alias Lookup
  if (ALIAS_LOOKUP_MAP.has(lowerRaw)) {
    return ALIAS_LOOKUP_MAP.get(lowerRaw)!;
  }

  // 2. Cleaned Category Lookup
  const cleanedCategory = cleanRawCategoryString(combinedRaw);
  const lowerCleaned = cleanedCategory.toLowerCase();
  if (lowerCleaned && ALIAS_LOOKUP_MAP.has(lowerCleaned)) {
    return ALIAS_LOOKUP_MAP.get(lowerCleaned)!;
  }

  // 3. Keyword Match on Category String
  for (const cat of CANONICAL_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (lowerRaw.includes(kw) || lowerCleaned.includes(kw)) {
        return cat.name;
      }
    }
  }

  // 4. Fallback Keyword Match on Channel Name + Stream URL if category is generic / missing
  if (!combinedRaw || ['general', 'default', 'undefined', 'other', 'iptv', 'channels'].includes(lowerRaw)) {
    const nameLower = (channelName || '').toLowerCase();
    const urlLower = (streamUrl || '').toLowerCase();
    const fullText = `${nameLower} ${urlLower}`;

    // Music heuristics
    if (fullText.includes('trace') || fullText.includes('mtv') || fullText.includes('music') || fullText.includes('clip') || fullText.includes('afrobeats') || fullText.includes('zouglou')) {
      return 'Musique';
    }
    // Sport heuristics
    if (fullText.includes('sport') || fullText.includes('foot') || fullText.includes('bein') || fullText.includes('canal+ sport') || fullText.includes('espn')) {
      return 'Sport';
    }
    // News heuristics
    if (fullText.includes('news') || fullText.includes('info') || fullText.includes('france 24') || fullText.includes('bfm') || fullText.includes('cnews') || fullText.includes('lci')) {
      return 'Actualités';
    }
    // Cinema heuristics
    if (fullText.includes('cine') || fullText.includes('movie') || fullText.includes('film') || fullText.includes('action') || urlLower.includes('/movie/') || urlLower.endsWith('.mp4') || urlLower.endsWith('.mkv')) {
      return 'Cinéma';
    }
    // Series heuristics
    if (fullText.includes('serie') || urlLower.includes('/series/') || fullText.includes('saison') || fullText.includes('episode')) {
      return 'Séries';
    }
    // Kids heuristics
    if (fullText.includes('kid') || fullText.includes('disney') || fullText.includes('gulli') || fullText.includes('cartoon') || fullText.includes('anime') || fullText.includes('jeunesse')) {
      return 'Jeunesse';
    }
    // Radio heuristics
    if (channelType === 'RADIO' || fullText.includes('radio') || fullText.includes('fm') || urlLower.endsWith('.mp3') || urlLower.endsWith('.aac')) {
      return 'Radio Local';
    }
    // Event heuristics
    if (channelType === 'DIRECT_EVENT' || fullText.includes('event') || fullText.includes('évènement') || fullText.includes('evenement')) {
      return 'Sport'; // Usually events are sports
    }
    // Religion heuristics
    if (fullText.includes('al bayane') || fullText.includes('emci') || fullText.includes('priere') || fullText.includes('eglise') || fullText.includes('islam') || fullText.includes('church')) {
      return 'Religion';
    }
    // Default fallback by type
    if (channelType === 'RADIO') return 'Radio Local';
    if (channelType === 'FILM') return 'Cinéma';
    if (channelType === 'SERIES') return 'Séries';
    if (channelType === 'DOCUMENTAIRE') return 'Documentaires';
    if (channelType === 'DESSIN_ANIME') return 'Jeunesse';
    return 'Divertissement';
  }

  // 5. If specific custom category, return cleaned version with capitalized first letter
  return cleanedCategory.charAt(0).toUpperCase() + cleanedCategory.slice(1);
}

/**
 * Checks if a channel matches a target category (fuzzy matching across canonical names and raw group-title)
 */
export function channelMatchesCategory(channel: IPTVContentItem, targetCategory: string): boolean {
  if (!targetCategory || targetCategory === 'ALL' || targetCategory === 'Tous') {
    return true;
  }

  const normTarget = normalizeIPTVCategory(targetCategory);
  const targetLower = targetCategory.toLowerCase().trim();
  const normTargetLower = normTarget.toLowerCase();

  // 1. Match on normalized category
  const channelNormCat = normalizeIPTVCategory(channel.category, channel.name, channel.type, channel.streamUrl);
  if (channelNormCat.toLowerCase() === normTargetLower) {
    return true;
  }

  // 2. Direct string equality (case-insensitive) on raw category or tvgName / groupTitle
  const rawCatLower = (channel.category || '').toLowerCase().trim();
  if (rawCatLower === targetLower || rawCatLower === normTargetLower) {
    return true;
  }

  // 3. Substring matching for compound categories (e.g. "FR | Musique" matches "Musique")
  if (rawCatLower.includes(normTargetLower) || normTargetLower.includes(rawCatLower)) {
    return true;
  }

  // 4. Keyword alias check for target category
  const catDef = CANONICAL_CATEGORIES.find((c) => c.name.toLowerCase() === normTargetLower || c.id === normTargetLower);
  if (catDef) {
    const combinedChannelText = `${channel.name} ${channel.category} ${channel.tvgName || ''}`.toLowerCase();
    for (const alias of catDef.aliases) {
      if (rawCatLower.includes(alias) || combinedChannelText.includes(alias)) {
        return true;
      }
    }
  }

  return false;
}

export interface CategorySummaryStat {
  category: string;
  normalizedName: string;
  icon: string;
  totalCount: number;
  activeCount: number;
  deadCount: number;
  unstableCount: number;
}

export type CategoryStatItem = CategorySummaryStat;

/**
 * Computes dynamic category breakdown with full audit numbers across the entire catalog
 */
export function computeCatalogCategoryStats(channels: IPTVContentItem[]): {
  categoryStats: CategorySummaryStat[];
  totalChannels: number;
  totalActive: number;
  totalDead: number;
  totalUnstable: number;
} {
  const statsMap = new Map<string, { total: number; active: number; dead: number; unstable: number; rawExamples: Set<string> }>();

  // Initialize canonical categories
  CANONICAL_CATEGORIES.forEach((cat) => {
    statsMap.set(cat.name, { total: 0, active: 0, dead: 0, unstable: 0, rawExamples: new Set() });
  });

  let totalChannels = 0;
  let totalActive = 0;
  let totalDead = 0;
  let totalUnstable = 0;

  (channels || []).forEach((c) => {
    if (!c) return;
    totalChannels++;

    const isDead = c.healthClassification === 'DEAD' || c.status === 'Inactif';
    const isUnstable = c.healthClassification === 'UNSTABLE';
    const isActive = !isDead && (c.isActivePlaylistEligible !== false || c.status === 'Actif');

    if (isDead) totalDead++;
    else if (isUnstable) totalUnstable++;
    else totalActive++;

    const normCat = normalizeIPTVCategory(c.category, c.name, c.type, c.streamUrl);

    let stat = statsMap.get(normCat);
    if (!stat) {
      stat = { total: 0, active: 0, dead: 0, unstable: 0, rawExamples: new Set() };
      statsMap.set(normCat, stat);
    }

    stat.total++;
    if (isDead) stat.dead++;
    else if (isUnstable) stat.unstable++;
    else stat.active++;

    if (c.category) stat.rawExamples.add(c.category);
  });

  const categoryStats: CategorySummaryStat[] = Array.from(statsMap.entries())
    .filter(([_, data]) => data.total > 0)
    .map(([catName, data]) => {
      const def = CANONICAL_CATEGORIES.find((c) => c.name === catName);
      return {
        category: catName,
        normalizedName: catName,
        icon: def?.icon || '📺',
        totalCount: data.total,
        activeCount: data.active,
        deadCount: data.dead,
        unstableCount: data.unstable
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount);

  return {
    categoryStats,
    totalChannels,
    totalActive,
    totalDead,
    totalUnstable
  };
}

export interface MultiCriteriaFilterOptions {
  searchQuery?: string;
  category?: string;
  country?: string;
  quality?: string;
  type?: string;
  status?: string;
  playlistId?: string;
  agencyScope?: string;
  activeOnly?: boolean;
}

/**
 * High-performance Multi-criteria filter operating on the full catalog
 */
export function filterIPTVCatalog(
  catalog: IPTVContentItem[],
  options: MultiCriteriaFilterOptions
): IPTVContentItem[] {
  if (!catalog || catalog.length === 0) return [];

  const {
    searchQuery = '',
    category = 'ALL',
    country = 'ALL',
    quality = 'ALL',
    type = 'ALL',
    status = 'ALL',
    playlistId = 'ALL',
    agencyScope = 'NATIONAL',
    activeOnly = false
  } = options;

  const q = searchQuery.trim().toLowerCase();
  const isAllCat = !category || category === 'ALL' || category === 'Tous';
  const isAllCountry = !country || country === 'ALL' || country === 'Tous';
  const isAllQuality = !quality || quality === 'ALL';
  const isAllType = !type || type === 'ALL';
  const isAllStatus = !status || status === 'ALL';
  const isAllPlaylist = !playlistId || playlistId === 'ALL';

  return catalog.filter((item) => {
    if (!item) return false;

    // 1. Active Only Filter (Traveler Mode / Health Filter)
    if (activeOnly) {
      if (item.healthClassification === 'DEAD' || item.status === 'Inactif' || item.isActivePlaylistEligible === false) {
        return false;
      }
    }

    // 2. Tenant / Agency Scope
    if (agencyScope !== 'NATIONAL' && item.agencyId && item.agencyId !== 'NATIONAL' && item.agencyId !== agencyScope) {
      return false;
    }

    // 3. Category Filter with Canonical Fuzzy Matching
    if (!isAllCat && !channelMatchesCategory(item, category)) {
      return false;
    }

    // 4. Country Filter
    if (!isAllCountry) {
      const cCountry = (item.country || '').toLowerCase().trim();
      const targetCountry = country.toLowerCase().trim();
      if (cCountry !== targetCountry && !cCountry.includes(targetCountry) && !targetCountry.includes(cCountry)) {
        return false;
      }
    }

    // 5. Type Filter
    if (!isAllType && item.type !== type) {
      return false;
    }

    // 6. Quality Filter
    if (!isAllQuality && item.quality !== quality) {
      return false;
    }

    // 7. Status Filter
    if (!isAllStatus && item.status !== status) {
      return false;
    }

    // 8. Playlist Filter
    if (!isAllPlaylist && item.playlistId !== playlistId) {
      return false;
    }

    // 9. Text Search Filter (Name, Category, Country, Program, Synopsis, URL)
    if (q) {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const normCat = normalizeIPTVCategory(item.category, item.name, item.type, item.streamUrl).toLowerCase();
      const cntry = (item.country || '').toLowerCase();
      const prog = (item.currentProgram || '').toLowerCase();
      const syn = (item.synopsis || '').toLowerCase();
      const url = (item.streamUrl || '').toLowerCase();

      const matches =
        name.includes(q) ||
        cat.includes(q) ||
        normCat.includes(q) ||
        cntry.includes(q) ||
        prog.includes(q) ||
        syn.includes(q) ||
        url.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}
