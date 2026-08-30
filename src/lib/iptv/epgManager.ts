/**
 * EPG (Electronic Program Guide) Utility
 * XMLTV and JSON EPG Parser & Program Matcher
 */

export interface EPGProgram {
  id: string;
  channelTvgId: string;
  title: string;
  description?: string;
  startTime: string; // ISO or HH:MM
  stopTime: string;  // ISO or HH:MM
  category?: string;
  progressPercent?: number;
}

export interface EPGChannelData {
  tvgId: string;
  currentProgram?: EPGProgram;
  nextProgram?: EPGProgram;
}

/**
 * Parses XMLTV string into EPG programs
 */
export function parseXMLTVEpg(xmlString: string): Map<string, EPGProgram[]> {
  const epgMap = new Map<string, EPGProgram[]>();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const programmeNodes = doc.querySelectorAll('programme');

    const now = new Date();

    programmeNodes.forEach((node, idx) => {
      const channelId = node.getAttribute('channel') || '';
      const startRaw = node.getAttribute('start') || '';
      const stopRaw = node.getAttribute('stop') || '';

      const titleNode = node.querySelector('title');
      const descNode = node.querySelector('desc');
      const categoryNode = node.querySelector('category');

      const title = titleNode ? titleNode.textContent || 'Programme Inconnu' : 'Programme Inconnu';
      const description = descNode ? descNode.textContent || '' : undefined;
      const category = categoryNode ? categoryNode.textContent || '' : undefined;

      if (!channelId) return;

      const program: EPGProgram = {
        id: `epg-${idx}-${Date.now()}`,
        channelTvgId: channelId,
        title,
        description,
        startTime: formatXMLTVDate(startRaw),
        stopTime: formatXMLTVDate(stopRaw),
        category
      };

      if (!epgMap.has(channelId)) {
        epgMap.set(channelId, []);
      }
      epgMap.get(channelId)!.push(program);
    });
  } catch (err) {
    console.warn("Failed to parse XMLTV EPG data:", err);
  }

  return epgMap;
}

/**
 * Format XMLTV date string (YYYYMMDDHHMMSS +0000) into readable time
 */
function formatXMLTVDate(xmltvDate: string): string {
  if (!xmltvDate || xmltvDate.length < 12) return 'En cours';
  const year = xmltvDate.slice(0, 4);
  const month = xmltvDate.slice(4, 6);
  const day = xmltvDate.slice(6, 8);
  const hour = xmltvDate.slice(8, 10);
  const min = xmltvDate.slice(10, 12);
  return `${hour}:${min}`;
}

/**
 * Fetch and parse EPG from XMLTV URL
 */
export async function fetchEPGData(epgUrl: string): Promise<Map<string, EPGProgram[]>> {
  if (!epgUrl || !epgUrl.startsWith('http')) {
    return new Map();
  }

  try {
    const res = await fetch(epgUrl);
    if (!res.ok) {
      throw new Error(`EPG Fetch Failed with HTTP ${res.status}`);
    }
    const xmlText = await res.text();
    return parseXMLTVEpg(xmlText);
  } catch (err) {
    console.warn("EPG Fetch failed:", err);
    return new Map();
  }
}
