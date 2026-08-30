import { IPTVContentItem, IPTVQuality } from '../../../types/iptv';

export class IPTVDomain {
  /**
   * Determine whether stream quality should downgrade based on network connection
   */
  static selectOptimalQuality(networkSpeedMbps: number): IPTVQuality {
    if (networkSpeedMbps >= 15) return '4K Ultra HD';
    if (networkSpeedMbps >= 8) return '1080p Full HD';
    if (networkSpeedMbps >= 3) return '720p HD';
    return 'SD Standard';
  }

  /**
   * Check content appropriateness against profile
   */
  static isContentAgeAppropriate(item: IPTVContentItem, isKidProfile: boolean): boolean {
    if (isKidProfile && (item.category === 'Jeunesse' || item.type === 'DESSIN_ANIME')) {
      return true;
    }
    if (isKidProfile && item.category === 'Cinéma') {
      return false;
    }
    return true;
  }
}
