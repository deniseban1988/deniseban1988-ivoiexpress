import { IPTVContentItem } from '../../../types/iptv';
import { EPGScheduleItem } from './types';

export class EPGHelper {
  /**
   * Generates a 24-hour dynamic schedule for a given IPTV channel based on the current time
   */
  public static getChannelSchedule(channel: IPTVContentItem): EPGScheduleItem[] {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const totalMinutesNow = currentHour * 60 + currentMinutes;

    const templates = EPGHelper.getScheduleTemplatesForCategory(channel.category, channel.name, channel.type);
    const schedule: EPGScheduleItem[] = [];

    // Base template blocks throughout the 24h cycle
    let minuteCursor = 0;
    let index = 0;

    while (minuteCursor < 24 * 60) {
      const template = templates[index % templates.length];
      const duration = template.durationMinutes;
      const startMin = minuteCursor;
      const endMin = Math.min(24 * 60, minuteCursor + duration);

      const startH = Math.floor(startMin / 60);
      const startM = startMin % 60;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;

      const startTimeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTimeStr = `${String(endH === 24 ? 0 : endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      const isLive = totalMinutesNow >= startMin && totalMinutesNow < endMin;
      let progressPercent = 0;

      if (isLive) {
        const elapsed = totalMinutesNow - startMin;
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
      } else if (totalMinutesNow >= endMin) {
        progressPercent = 100;
      }

      // If channel specifically has custom currentProgram and this block is live, override title
      let title = template.title;
      let description = template.description;

      if (isLive && channel.currentProgram) {
        title = channel.currentProgram;
      } else if (startMin > totalMinutesNow && schedule.length === 1 && channel.nextProgram) {
        title = channel.nextProgram;
      }

      schedule.push({
        id: `${channel.id}-epg-${index}`,
        title,
        subtitle: template.subtitle || `${channel.name} Exclusive`,
        category: channel.category || 'Généraliste',
        startTime: startTimeStr,
        endTime: endTimeStr,
        startMinutes: startMin,
        endMinutes: endMin,
        durationMinutes: duration,
        progressPercent,
        isLive,
        description: description || `Émission diffusée en direct sur ${channel.name}. Profitez d'une qualité HD exceptionnelle.`,
        presenter: template.presenter
      });

      minuteCursor = endMin;
      index++;
    }

    return schedule;
  }

  /**
   * Retrieves the currently active program in the schedule
   */
  public static getCurrentLiveProgram(channel: IPTVContentItem): EPGScheduleItem | null {
    const schedule = EPGHelper.getChannelSchedule(channel);
    return schedule.find(item => item.isLive) || schedule[0] || null;
  }

  /**
   * Generates realistic category-specific program blocks
   */
  private static getScheduleTemplatesForCategory(category: string = '', channelName: string = '', type: string = 'TV') {
    const isRadio = type === 'RADIO';

    if (isRadio) {
      return [
        { title: 'Matinale Info & Réveil Express', durationMinutes: 180, subtitle: 'Édition Matin', presenter: 'Équipe Matinale', description: 'Le grand journal de la matinale, météo, revue de presse et bonne humeur.' },
        { title: 'Hits & Musiques Non-Stop', durationMinutes: 120, subtitle: 'Playlists Urbaines & Variétés', description: 'Les meilleurs morceaux du moment et classiques africains.' },
        { title: 'Le Débat de Midi & Tribune des Auditeurs', durationMinutes: 90, subtitle: 'Ligne Ouverte', presenter: 'Grand Débatteur', description: 'Actualités brûlantes, économie, société et réactions en direct.' },
        { title: 'Musiques du Terroir & Afrobeat', durationMinutes: 150, subtitle: 'Sélection Spéciale', description: 'Rythmes d\'Afrique de l\'Ouest, Coupé-Décalé, Zouglou et Highlife.' },
        { title: 'Le Grand Journal du Soir & Sports', durationMinutes: 60, subtitle: 'Édition 19h', presenter: 'Rédaction en Chef', description: 'Synthèse complète de l\'actualité nationale et internationale.' },
        { title: 'Soirée Confidences & Ambiance Acoustique', durationMinutes: 180, subtitle: 'Late Night FM', presenter: 'Animateur Nocturne', description: 'Dédicaces, slow et musiques douces pour accompagner la nuit.' },
        { title: 'Rediffusion & Nuit Musicale', durationMinutes: 660, subtitle: 'Programme Nuit', description: 'Les meilleurs moments de la journée en continu.' },
      ];
    }

    const cat = category.toLowerCase();

    if (cat.includes('sport')) {
      return [
        { title: 'Le Club Sports & Analyse Tactique', durationMinutes: 60, subtitle: 'Mag Football', presenter: 'Consultants Experts', description: 'Retour sur les grands matchs du week-end et analyses exclusives.' },
        { title: 'Grand Format : Match de Championnat en Direct', durationMinutes: 120, subtitle: 'Direct Live HD', description: 'Couverture intégrale du choc de la journée avec commentaires immersifs.' },
        { title: 'Le Journal des Sports & Résultats Mondiaux', durationMinutes: 30, subtitle: 'Édition Express', description: 'Tous les scores en direct : Ligue des Champions, CAN, NBA, Formule 1.' },
        { title: 'Documentaire : Légendes du Sport Africain', durationMinutes: 90, subtitle: 'Histoire & Héritage', description: 'Rétrospective sur les athlètes qui ont marqué l\'histoire sportive.' },
        { title: 'Multiplex Soirée & Débrief d\'Après-Match', durationMinutes: 120, subtitle: 'Plateau Live', description: 'Interviews vestiaires, réactions à chaud et temps forts.' },
        { title: 'Rediffusions Grands Moments & Nuit Sports', durationMinutes: 1020, subtitle: 'Archives d\'Or', description: 'Les plus beaux buts et compétitions mythiques.' },
      ];
    }

    if (cat.includes('cinéma') || cat.includes('film') || cat.includes('séries')) {
      return [
        { title: 'Cinéma Matin : Comédie Populaire', durationMinutes: 110, subtitle: 'Long Métrage', description: 'Une comédie rafraîchissante pour bien commencer la matinée.' },
        { title: 'Magazine : Les Coulisses du 7ème Art', durationMinutes: 40, subtitle: 'Making Of & Interviews', description: 'Rencontre avec les réalisateurs et acteurs phares de la saison.' },
        { title: 'Série Culte : Épisodes Intégraux', durationMinutes: 150, subtitle: 'Saison Blockbuster', description: 'Marathon de votre série préférée en version remastérisée.' },
        { title: 'Grand Film du Soir : Drame & Action Prime Time', durationMinutes: 130, subtitle: 'Prime Time HD', description: 'Le grand film à ne pas manquer, exclusivité télévisuelle.' },
        { title: 'Ciné-Club Nocturne & Thriller Psychologique', durationMinutes: 110, subtitle: 'Séance de Minuit', description: 'Suspense palpitant et scénario captivant.' },
        { title: 'Nuit des Courts-Métrages & Cinéma d\'Auteur', durationMinutes: 900, subtitle: 'Pépites du Cinéma', description: 'Découvrez les chefs-d\'œuvre du cinéma indépendant.' },
      ];
    }

    if (cat.includes('actu') || cat.includes('info') || cat.includes('news')) {
      return [
        { title: 'La Grande Matinale Info 6h-9h', durationMinutes: 180, subtitle: 'Direct Continu', presenter: 'Présentateur Matin', description: 'Décryptage de l\'actualité politique, sociale, trafic et marchés financiers.' },
        { title: 'Le Journal de la Mi-Journée 13H', durationMinutes: 45, subtitle: 'Édition Complète', presenter: 'Journaliste Principal', description: 'Les titres forts de la mi-journée et reportages sur le terrain.' },
        { title: 'Le Forum International & Géopolitique', durationMinutes: 75, subtitle: 'Regards Croisés', description: 'Enjeux géopolitiques mondiaux et correspondants aux quatre coins du globe.' },
        { title: 'Le Grand Journal du Soir 20H', durationMinutes: 60, subtitle: 'Le 20 Heures', presenter: 'Présentateur Vedette', description: 'Le grand rendez-vous d\'information de la soirée avec invités de marque.' },
        { title: 'Le Débat d\'Actualité & Enquête Exclusive', durationMinutes: 90, subtitle: 'Grand Angle', description: 'Analyses poussées, dossiers d\'investigation et débat contradictoire.' },
        { title: 'Le Fil Info Continu & Flashs de Nuit', durationMinutes: 990, subtitle: 'Info 24/7', description: 'L\'information vérifiée en continu minute par minute.' },
      ];
    }

    if (cat.includes('jeunesse') || cat.includes('dessin') || cat.includes('enfant')) {
      return [
        { title: 'Les Dessins Animés du Matin', durationMinutes: 180, subtitle: 'Kids Club', description: 'Aventures animées amusantes et éducatives pour les plus jeunes.' },
        { title: 'Série Animée 3D : Mission Découverte', durationMinutes: 90, subtitle: 'Aventure Éducative', description: 'Jeux interactifs, découvertes scientifiques et contes merveilleux.' },
        { title: 'Après-Midi Héros & Super-Pouvoirs', durationMinutes: 180, subtitle: 'Grande Aventure', description: 'Les séries jeunesse les plus populaires en haute définition.' },
        { title: 'Long-Métrage d\'Animation Familial', durationMinutes: 110, subtitle: 'Soirée Famille', description: 'Un magnifique film d\'animation à savourer en famille.' },
        { title: 'Contes Apaisants pour la Nuit', durationMinutes: 90, subtitle: 'Douce Nuit', description: 'Histoires relaxantes et berceuses calmes.' },
        { title: 'Nuit Paisible & Musique Enfants', durationMinutes: 790, subtitle: 'Berceuses TV', description: 'Ambiance sonore douce.' },
      ];
    }

    // Default Generalist / Cultural / Entertainment Template
    return [
      { title: 'Le Réveil des Régions & Bonjour Pays', durationMinutes: 150, subtitle: 'Matinale Terroir', presenter: 'Animateur Culturel', description: 'Découverte des traditions, artisanat et actualités régionales.' },
      { title: 'Magazine Découverte & Évasion', durationMinutes: 90, subtitle: 'Horizons Lointains', description: 'Voyage à travers les plus beaux sites touristiques et paysages.' },
      { title: 'Le Journal Télévisé de la Mi-Journée', durationMinutes: 45, subtitle: 'Le 13H', presenter: 'Journaliste de Garde', description: 'Synthèse des événements du jour et bulletins météo régionaux.' },
      { title: 'Télénovela & Grande Saga de l\'Après-Midi', durationMinutes: 120, subtitle: 'Feuilleton Événement', description: 'Passion, rebondissements et émotions fortes.' },
      { title: 'Talk-Show Divertissement & Jeux', durationMinutes: 75, subtitle: 'Tous Ensemble', presenter: 'Animateur Vedette', description: 'Jeux télévisés, humour, défis et invités prestigieux.' },
      { title: 'Le Grand Journal du Soir 20H', durationMinutes: 60, subtitle: 'Le 20H National', presenter: 'Présentateur Titulaire', description: 'Le grand journal d\'information nationale et internationale.' },
      { title: 'Grand Show de Divertissement Prime Time', durationMinutes: 135, subtitle: 'Prime Time Live', presenter: 'Star du PAF', description: 'Concerts, variétés, humour et grands reportages en première partie de soirée.' },
      { title: 'Nuit Musicale & Rediffusions Intégrales', durationMinutes: 765, subtitle: 'Nuit Blanche', description: 'Programmation musicale et magazines de découverte.' },
    ];
  }
}
