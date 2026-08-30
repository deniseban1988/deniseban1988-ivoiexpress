import React from 'react';
import {
  Bus,
  Hotel,
  Eye,
  Tv,
  ShieldCheck,
  UserPlus,
  Lock,
  ChevronRight,
  HelpCircle,
  QrCode,
  Bell,
  Star,
  Play,
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { IxPastelShortcutCard, IxIconOnlyShortcutCard, IxServiceEmojiCard, IxWelcomeBanner, IxPromoBanner } from './IvoirexpressUIKit';
import { SynchronizedBannersBar } from './SynchronizedBannersBar';
import { Hotel as HotelType, BusTrip } from '../../types';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onExploreTab: (tab: 'transport' | 'hotels' | 'vision' | 'iptv') => void;
  onQuickRoleLogin: (email: string) => void;
  hotels?: HotelType[];
  trips?: BusTrip[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onExploreTab,
  onQuickRoleLogin,
  hotels = [],
  trips = []
}) => {
  return (
    <div className="space-y-4 text-left pb-12">
      
      {/* ================= 1. BANDEAU DE BIENVENUE COMPACT ================= */}
      <IxWelcomeBanner
        userName="Voyageur"
        subtitle="Portail unifié Ivoirexpress : bus interurbain, séjours hôteliers, vidéo-sécurité et streaming TV à bord."
        isVerified={true}
        onActionClick={() => onExploreTab('transport')}
      />

      {/* ================= 1.B BANNIÈRE SYNCHRONISÉE DEPUIS CLOUD FIRESTORE ================= */}
      <SynchronizedBannersBar targetModuleFilter="ACCUEIL" className="my-2" />

      {/* ================= 2. GRILLE DES 4 SERVICES PRINCIPAUX (2x2 AVEC FONDS PASTEL DOUX & EMOJIS CENTRÉS) ================= */}
      <section aria-label="Services principaux" className="-mt-1 sm:-mt-1.5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          
          <IxServiceEmojiCard
            id="service-transport"
            module="transport"
            ariaLabel="Transport"
            tooltip="Transport : voyages autocar VIP"
            emoji="🚌"
            icon={Bus}
            onClick={() => onExploreTab('transport')}
          />

          <IxServiceEmojiCard
            id="service-hotels"
            module="hotels"
            ariaLabel="Hôtellerie"
            tooltip="Hôtellerie : séjours & réservations d'hôtels"
            emoji="🏨"
            icon={Hotel}
            onClick={() => onExploreTab('hotels')}
          />

          <IxServiceEmojiCard
            id="service-vision"
            module="vision"
            ariaLabel="Surveillance"
            tooltip="Surveillance : caméras IA & sécurité en direct"
            emoji="📹"
            icon={Eye}
            onClick={() => onExploreTab('vision')}
          />

          <IxServiceEmojiCard
            id="service-iptv"
            module="iptv"
            ariaLabel="Streaming"
            tooltip="Streaming TV : chaînes nationales & divertissement à bord"
            emoji="📺"
            icon={Tv}
            onClick={() => onExploreTab('iptv')}
          />

        </div>
      </section>

      {/* ================= 3. BANNIÈRE PROMOTIONNELLE 1 (ENTRE LES CARTES DE SERVICES) ================= */}
      <IxPromoBanner
        title="Offre Vacances : -20% sur la Formule Car + Hôtel !"
        description="Réservez simultanément votre trajet autocar VIP et votre chambre d'hôtel partenaire."
        badgeText="-20% Promo"
        ctaText="En profiter"
        onCtaClick={() => onExploreTab('transport')}
      />

      {/* ================= 4. SERVICES PRINCIPAUX SIMPLIFIÉS : ASSISTANCE & BILLETTERIE (ACCÈS DIRECT PAR ICÔNES ÉPURÉES SANS LIBELLÉ ENCOMBRANT) ================= */}
      <section aria-label="Services essentiels">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">

          <IxIconOnlyShortcutCard
            id="assistance"
            module="assistance"
            ariaLabel="Assistance"
            tooltip="Assistance & Support voyageur 24h/7j"
            emoji="🎧"
            icon={HelpCircle}
            onClick={onOpenLogin}
          />

          <IxIconOnlyShortcutCard
            id="settings"
            module="settings"
            ariaLabel="Billetterie"
            tooltip="Billetterie : mes pass et QR codes"
            emoji="🎫"
            icon={QrCode}
            onClick={() => onExploreTab('transport')}
          />

        </div>
      </section>

      {/* ================= 5. BANNIÈRE PROMOTIONNELLE 2 (SECONDE BANNIÈRE) ================= */}
      <IxPromoBanner
        title="Sécurité IA & Streaming 5G à bord de vos autocars"
        description="Caméras anti-collision en direct et chaînes TV nationales (RTI1, NCI) offertes sur tous les trajets."
        badgeText="Inclus à Bord"
        ctaText="Découvrir"
        onCtaClick={() => onExploreTab('iptv')}
      />

      {/* ================= 3. CARROUSEL HORIZONTAL : PROMOTIONS & ANNONCES ================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center space-x-1.5">
            <Tag className="w-4 h-4 text-[#F5821F]" />
            <span>Offres & Promotions Spéciales</span>
          </h3>
          <span className="text-[11px] text-[#6B7280]">Faire défiler ➔</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none scroll-smooth">
          
          {/* Card Promo 1 */}
          <div className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-r from-[#0F2D52] to-[#1E4273] text-white p-4 rounded-[18px] border border-white/10 ivx-banner-shadow space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#F5821F] text-white text-[10px] font-bold uppercase">
                -20% Formule Combinée
              </span>
              <span className="text-[10px] text-slate-300">UTB + Sofitel</span>
            </div>
            <h4 className="text-sm font-bold text-white line-clamp-1">Car VIP Abidjan ➔ Yamoussoukro + Hôtel 5★</h4>
            <p className="text-[11px] text-slate-300 line-clamp-1">Économisez jusqu'à 25 000 FCFA sur votre formule de vacances.</p>
            <button
              onClick={() => onExploreTab('transport')}
              className="px-3 py-1.5 rounded-[10px] bg-[#F5821F] hover:bg-[#e07317] text-white text-xs font-bold flex items-center space-x-1 mt-1"
            >
              <span>Réserver combiné</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Promo 2 */}
          <div className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-r from-[#166534] to-[#15803D] text-white p-4 rounded-[18px] border border-white/10 ivx-banner-shadow space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#22C55E] text-white text-[10px] font-bold uppercase">
                Wifi 5G Offert
              </span>
              <span className="text-[10px] text-emerald-100">À bord des Autocars</span>
            </div>
            <h4 className="text-sm font-bold text-white line-clamp-1">Internet Illimité & TV Direct RTI1</h4>
            <p className="text-[11px] text-emerald-100 line-clamp-1">Inclus gratuitement dans toutes les réservations VIP IVOIReXpress.</p>
            <button
              onClick={() => onExploreTab('iptv')}
              className="px-3 py-1.5 rounded-[10px] bg-white text-[#166534] hover:bg-emerald-50 text-xs font-bold flex items-center space-x-1 mt-1"
            >
              <span>Tester l'IPTV</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card Promo 3 */}
          <div className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-r from-[#6B21A8] to-[#9333EA] text-white p-4 rounded-[18px] border border-white/10 ivx-banner-shadow space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-[#D8B4FE] text-[#6B21A8] text-[10px] font-bold uppercase">
                Famille & Groupes
              </span>
              <span className="text-[10px] text-purple-200">Tarif Préférentiel</span>
            </div>
            <h4 className="text-sm font-bold text-white line-clamp-1">4ème Billet Offert vers San Pédro</h4>
            <p className="text-[11px] text-purple-100 line-clamp-1">Valable tous les weekends du mois d'août 2026.</p>
            <button
              onClick={() => onExploreTab('transport')}
              className="px-3 py-1.5 rounded-[10px] bg-white text-[#6B21A8] hover:bg-purple-50 text-xs font-bold flex items-center space-x-1 mt-1"
            >
              <span>Voir détails</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ================= 4. CARROUSEL HORIZONTAL : HÔTELS RECOMMANDÉS ================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center space-x-1.5">
            <Hotel className="w-4 h-4 text-[#22C55E]" />
            <span>Hôtels Partenaires Recommandés</span>
          </h3>
          <button
            onClick={() => onExploreTab('hotels')}
            className="text-xs font-bold text-[#22C55E] hover:underline flex items-center space-x-0.5"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none scroll-smooth">
          {(hotels.length > 0 ? hotels.slice(0, 6) : [
            {
              id: 'hotel-sofitel',
              name: "Sofitel Abidjan Hôtel d'Ivoire",
              city: 'Abidjan',
              commune: 'Cocody',
              address: 'Boulevard Hassan II',
              stars: 5,
              imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
              minPrice: 120000
            },
            {
              id: 'hotel-president',
              name: "Hôtel Président Yamoussoukro",
              city: 'Yamoussoukro',
              commune: 'Centre-Ville',
              address: 'Boulevard de la Paix',
              stars: 4,
              imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
              minPrice: 45000
            },
            {
              id: 'hotel-parliament',
              name: "Parliament Hotel San Pédro",
              city: 'San Pédro',
              commune: 'Bord de mer',
              address: 'Boulevard Maritime',
              stars: 3,
              imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
              minPrice: 35000
            }
          ]).map((h: any) => (
            <div
              key={h.id}
              onClick={() => onExploreTab('hotels')}
              className="snap-start shrink-0 w-[220px] sm:w-[240px] bg-white border border-[#E5E7EB] hover:border-[#22C55E]/50 rounded-[18px] p-3 ivx-card-shadow-hover cursor-pointer space-y-2"
            >
              <div className="h-28 rounded-[12px] bg-slate-200 overflow-hidden relative">
                <img
                  src={h.imageUrl || h.gallery?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                  alt={h.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>{h.rating || '4.8'} ({h.stars || 4}★)</span>
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1F2937] truncate">{h.name}</h4>
                <p className="text-[10px] text-[#6B7280] flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-[#22C55E]" />
                  <span>{h.commune ? `${h.commune}, ` : ''}{h.city}</span>
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
                <span className="text-xs font-black text-[#22C55E]">{(h.minPrice || h.priceRange || 50000).toLocaleString()} FCFA <span className="text-[9px] text-[#6B7280] font-normal">/nuit</span></span>
                <span className="text-[10px] font-bold text-[#22C55E] bg-[#E9F9EF] px-2 py-0.5 rounded-full">Réserver</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 5. CARROUSEL HORIZONTAL : IPTV & CHAÎNES À BORD ================= */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-[#1F2937] flex items-center space-x-1.5">
            <Tv className="w-4 h-4 text-[#9333EA]" />
            <span>Chaînes Live IPTV & VOD à bord</span>
          </h3>
          <button
            onClick={() => onExploreTab('iptv')}
            className="text-xs font-bold text-[#9333EA] hover:underline flex items-center space-x-0.5"
          >
            <span>Regarder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none scroll-smooth">
          
          {/* Channel 1 */}
          <div
            onClick={() => onExploreTab('iptv')}
            className="snap-start shrink-0 w-[180px] sm:w-[200px] bg-slate-900 text-white rounded-[16px] p-3 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-2 ivx-card-dark-shadow"
          >
            <div className="h-20 rounded-[10px] bg-slate-800 flex items-center justify-center relative overflow-hidden">
              <span className="font-extrabold text-sm text-amber-400">RTI 1 DIRECT</span>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200">Journal 20H</span>
              <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">LIVE</span>
            </div>
          </div>

          {/* Channel 2 */}
          <div
            onClick={() => onExploreTab('iptv')}
            className="snap-start shrink-0 w-[180px] sm:w-[200px] bg-slate-900 text-white rounded-[16px] p-3 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-2 ivx-card-dark-shadow"
          >
            <div className="h-20 rounded-[10px] bg-slate-800 flex items-center justify-center relative overflow-hidden">
              <span className="font-extrabold text-sm text-blue-400">CANAL+ SPORT</span>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200">Ligue 1 Ivoirienne</span>
              <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">LIVE</span>
            </div>
          </div>

          {/* Channel 3 */}
          <div
            onClick={() => onExploreTab('iptv')}
            className="snap-start shrink-0 w-[180px] sm:w-[200px] bg-slate-900 text-white rounded-[16px] p-3 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer space-y-2 ivx-card-dark-shadow"
          >
            <div className="h-20 rounded-[10px] bg-slate-800 flex items-center justify-center relative overflow-hidden">
              <span className="font-extrabold text-sm text-orange-400">NCI CI</span>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200">Emission La Télé d'Ici</span>
              <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">LIVE</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
