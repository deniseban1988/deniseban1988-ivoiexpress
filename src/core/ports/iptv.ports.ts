import { IPTVContentItem, IPTVPlaylist } from '../../types/iptv';

export interface IIPTVRepository {
  getContents(type?: string): Promise<IPTVContentItem[]>;
  getPlaylists(): Promise<IPTVPlaylist[]>;
}

export interface IIPTVUseCase {
  getLiveChannels(): Promise<IPTVContentItem[]>;
  getVODCatalogue(): Promise<IPTVContentItem[]>;
}
