import { IIPTVUseCase, IIPTVRepository } from '../../ports/iptv.ports';
import { IPTVContentItem } from '../../../types/iptv';

export class IPTVUseCases implements IIPTVUseCase {
  constructor(private repository: IIPTVRepository) {}

  async getLiveChannels(): Promise<IPTVContentItem[]> {
    const all = await this.repository.getContents();
    return all.filter(c => c.type === 'TV' || c.type === 'RADIO');
  }

  async getVODCatalogue(): Promise<IPTVContentItem[]> {
    const all = await this.repository.getContents();
    return all.filter(c => c.type === 'FILM' || c.type === 'SERIES' || c.type === 'DOCUMENTAIRE' || c.type === 'DESSIN_ANIME');
  }
}
