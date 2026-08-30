import React from 'react';
import { IPTVContentItem } from '../../types/iptv';
import { SmartIPTVPlayerPremium } from './player/SmartIPTVPlayerPremium';

export interface IPTVPlayerModalProps {
  content: IPTVContentItem;
  allContents: IPTVContentItem[];
  isFavorite: boolean;
  onToggleFavorite: (contentId: string) => void;
  onSelectContent: (content: IPTVContentItem) => void;
  onClose: () => void;
  savedProgressSeconds?: number;
  onRecordProgress?: (content: IPTVContentItem, progressSeconds: number, totalSeconds: number) => void;
  userRole?: string;
  userAgencyId?: string;
}

/**
 * Smart IPTV Player Modal Wrapper
 * Delivers professional OTT/IPTV High-End streaming experience with Cast, AirPlay,
 * 24h EPG mini guide, adaptive bitrate selection, gesture controls & resilience.
 */
export const IPTVPlayerModal: React.FC<IPTVPlayerModalProps> = (props) => {
  return <SmartIPTVPlayerPremium {...props} />;
};

export { SmartIPTVPlayerPremium } from './player/SmartIPTVPlayerPremium';
