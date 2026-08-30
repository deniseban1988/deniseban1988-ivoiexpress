import {
  AIAssistantConfig,
  AIMemoryEntry,
  TransversalServiceStatus,
  SystemAnomaly,
  TransversalPaymentTransaction,
  TransversalNotificationLog,
  AISmartAction
} from '../types/aicore';

export const INITIAL_ASSISTANTS_CONFIG: AIAssistantConfig[] = [
  {
    type: 'VOYAGEUR',
    name: 'Assistant Voyageur',
    avatarLabel: 'Voyage',
    description: 'Assistance personnalisée pour les départs, recherche de trajets, d\'hôtels et recommandation média.',
    targetRole: 'Voyageurs & Touristes',
    systemPromptGoal: 'Aider à trouver des trajets en autocar, réserver des chambres d\'hôtel en Côte d\'Ivoire, suggérer des chaînes IPTV/radios pour le trajet et répondre aux questions fréquentes.',
    samplePrompts: [
      'Trouver un car Abidjan -> Yamoussoukro demain matin',
      'Quel hôtel recommandé à San-Pédro près de la plage ?',
      'Quelle chaîne TV sportive regarder pendant mon trajet ?',
      'Comment payer mon billet par Wave ou Orange Money ?'
    ],
    allowedActions: ['RESERVATION_PROPOSAL', 'ITINERARY_SUGGESTION', 'HOTEL_RECOMMENDATION', 'IPTV_RECOMMENDATION'],
    guardrails: [
      'Ne pas modifier de réservation sans validation explicite',
      'Ne pas demander les codes PIN Mobile Money',
      'S\'exprimer en FCFA uniquement'
    ]
  },
  {
    type: 'TRANSPORT',
    name: 'Assistant Transport',
    avatarLabel: 'Flotte',
    description: 'Analyse d\'exploitation pour les Administrateurs Agence (remplissage, fréquences, révisions autocars).',
    targetRole: 'Admin Agence & Chefs de Gare',
    systemPromptGoal: 'Analyser le taux d\'occupation des lignes, aider à la planification des horaires de départ, vérifier la maintenance préventive des autocars et suggérer des ajustements de fréquences.',
    samplePrompts: [
      'Analyse du taux d\'occupation de la ligne Abidjan-Bouaké cette semaine',
      'Quels autocars nécessitent une vidange avant ce week-end ?',
      'Proposer un horaire supplémentaire pour la période de pointe d\'Adjamé',
      'Synthèse des validations de billets par QR code'
    ],
    allowedActions: ['ITINERARY_SUGGESTION', 'SYSTEM_REPORT'],
    guardrails: [
      'Accès strictement restreint aux données de l\'agence connectée',
      'Validation requise pour la modification des fiches chauffeurs ou véhicules'
    ]
  },
  {
    type: 'HOTEL',
    name: 'Assistant Hôtellerie',
    avatarLabel: 'Hôtel',
    description: 'Gestion du taux de remplissage, prévisions de réservation et rapports de revenus pour gérants d\'hôtels.',
    targetRole: 'Admin Hôtel & Réception',
    systemPromptGoal: 'Produire des rapports de fréquentation, analyser les arrivées du jour, recommander des ajustements tarifaires saisonniers et suivre les paiements d\'acomptes.',
    samplePrompts: [
      'Combien de check-ins sont prévus aujourd\'hui à l\'Hôtel Ivoire ?',
      'Rapport de chiffre d\'affaires des réservations du mois',
      'Proposer un tarif promotionnel pour les chambres Deluxe en semaine',
      'Statut des paiements Mobile Money en attente de validation'
    ],
    allowedActions: ['HOTEL_RECOMMENDATION', 'SYSTEM_REPORT'],
    guardrails: [
      'Accès restreint à l\'établissement hôtelier de l\'administrateur',
      'Aucune annulation directe sans accord du client ou du gérant'
    ]
  },
  {
    type: 'VISION',
    name: 'Assistant Vision IA',
    avatarLabel: 'Vision',
    description: 'Interprétation des alertes de vidéosurveillance, statut des caméras et consignes de sécurité.',
    targetRole: 'Responsables Sécurité & Opérateurs PC',
    systemPromptGoal: 'Expliquer le degré de gravité des alertes visuelles (intrusions, attroupements, bagages abandonnés), suggérer des ajustements de sensibilité et générer des rapports de sécurité.',
    samplePrompts: [
      'Résumé des alertes critiques détectées dans la gare d\'Adjamé',
      'Pourquoi la caméra Cam#03 du quai 2 est-elle en statut alerte ?',
      'Recommander une révision des seuils de sensibilité pour la nuit',
      'Générer un rapport d\'incident pour la direction'
    ],
    allowedActions: ['CAMERA_CHECK_SUGGESTION', 'SYSTEM_REPORT'],
    guardrails: [
      'Respect strict du Règlement Général de Protection des Données et droit à l\'image',
      'Seuls les utilisateurs autorisés peuvent visualiser les flux de sécurité'
    ]
  },
  {
    type: 'IPTV',
    name: 'Assistant IPTV & Média',
    avatarLabel: 'Média',
    description: 'Guide des chaînes TV ivoiriennes, radios FM en direct, films VOD et recommandations de divertissement.',
    targetRole: 'Tous les utilisateurs & Passagers',
    systemPromptGoal: 'Recommander des films et séries du catalogue ivoirien, donner les fréquences et programmes des radios FM (Trace FM, Nostalgie), expliquer le fonctionnement du mode hors-ligne.',
    samplePrompts: [
      'Recommander un film comédie ivoirien pour mon trajet de 4 heures',
      'Quelles sont les chaînes d\'actualités disponibles en direct ?',
      'Comment ajouter RTI 1 et NCI à mes favoris ?',
      'Changer la qualité vidéo en 720p Éco pour économiser ma data'
    ],
    allowedActions: ['IPTV_RECOMMENDATION'],
    guardrails: [
      'Recommandations basées uniquement sur le catalogue autorisé',
      'Pas de contenus inappropriés ou non modérés'
    ]
  },
  {
    type: 'SUPER_ADMIN',
    name: 'Assistant Super Admin',
    avatarLabel: 'Super',
    description: 'Orchestration globale de la plateforme, détection d\'anomalies système, audit RBAC et rapports consolidés.',
    targetRole: 'Super Administrateurs Nationaux',
    systemPromptGoal: 'Analyser la santé globale d\'IVOIReXpress, détecter les anomalies de paiement ou de trafic, surveiller le registre d\'audit RBAC et générer des synthèses exécutives.',
    samplePrompts: [
      'Générer une synthèse nationale multi-modules pour la direction',
      'Détecter toute anomalie de transaction sur la passerelle Wave/MTN',
      'Analyser le registre des logs de sécurité des 24 dernières heures',
      'État de santé global des 7 services transversaux'
    ],
    allowedActions: ['SYSTEM_REPORT', 'CAMERA_CHECK_SUGGESTION', 'RESERVATION_PROPOSAL'],
    guardrails: [
      'Supervision haute sécurité',
      'Consignation obligatoire de toutes les requêtes exécutives'
    ]
  }
];

export const INITIAL_AI_MEMORIES: AIMemoryEntry[] = [
  {
    id: 'mem-1',
    key: 'Ville de prédilection',
    value: 'Yamoussoukro & Abidjan',
    category: 'PREFERENCE',
    updatedAt: '2026-08-01 14:30',
    isConfidential: false
  },
  {
    id: 'mem-2',
    key: 'Moyen de paiement favori',
    value: 'Wave Mobile Money',
    category: 'PREFERENCE',
    updatedAt: '2026-08-01 16:15',
    isConfidential: true
  },
  {
    id: 'mem-3',
    key: 'Type de voyage préféré',
    value: 'Autocar VIP Climatisé avec Wi-Fi',
    category: 'BEHAVIOR_CONTEXT',
    updatedAt: '2026-08-02 09:00',
    isConfidential: false
  },
  {
    id: 'mem-4',
    key: 'Chaînes TV les plus regardées',
    value: 'RTI 1, NCI, Canal+ Sport 1',
    category: 'FAVORITE',
    updatedAt: '2026-08-02 10:20',
    isConfidential: false
  }
];

export const INITIAL_TRANSVERSAL_SERVICES: TransversalServiceStatus[] = [
  {
    serviceId: 'auth-session',
    name: 'Authentification & Gestion des Sessions',
    iconName: 'Lock',
    status: 'Opérationnel',
    latencyMs: 12,
    uptimePercent: 99.98,
    lastCheck: 'À l\'instant',
    description: 'Connexion sécurisée, jetons JWT, gestion des rôles RBAC et sessions actives.'
  },
  {
    serviceId: 'users-rbac',
    name: 'Gestion des Utilisateurs & Rôles RBAC',
    iconName: 'Users',
    status: 'Opérationnel',
    latencyMs: 18,
    uptimePercent: 100,
    lastCheck: 'À l\'instant',
    description: 'Contrôle d\'accès granulaire (Voyageur, Admin Agence, Admin Hôtel, Super Admin).'
  },
  {
    serviceId: 'payments-hub',
    name: 'Hub de Paiement Unique',
    iconName: 'CreditCard',
    status: 'Opérationnel',
    latencyMs: 45,
    uptimePercent: 99.95,
    lastCheck: 'À l\'instant',
    description: 'Passerelle transversale unifiée Wave, MTN, Orange, Moov Money et Carte Bancaire.'
  },
  {
    serviceId: 'notifications-hub',
    name: 'Centre de Notifications Multi-Canal',
    iconName: 'Bell',
    status: 'Opérationnel',
    latencyMs: 25,
    uptimePercent: 99.90,
    lastCheck: 'À l\'instant',
    description: 'Dispatching Push Web, E-mail et SMS d\'alerte de voyage et sécurité.'
  },
  {
    serviceId: 'file-storage',
    name: 'Stockage & Gestion des Médias',
    iconName: 'HardDrive',
    status: 'Opérationnel',
    latencyMs: 32,
    uptimePercent: 99.99,
    lastCheck: 'À l\'instant',
    description: 'Stockage sécurisé des photos d\'autocars, d\'hôtels, extraits vidéo IA et logos.'
  },
  {
    serviceId: 'audit-logging',
    name: 'Registre d\'Audit & Journalisation',
    iconName: 'FileText',
    status: 'Opérationnel',
    latencyMs: 15,
    uptimePercent: 100,
    lastCheck: 'À l\'instant',
    description: 'Traçabilité immuable de toutes les opérations sensibles et validations d\'actions.'
  },
  {
    serviceId: 'ai-core-orchestrator',
    name: 'Orchestrateur AI Core & Gemini',
    iconName: 'Brain',
    status: 'Opérationnel',
    latencyMs: 120,
    uptimePercent: 99.85,
    lastCheck: 'À l\'instant',
    description: 'Cerveau intelligent orchestrant les 6 assistants spécialisés et la détection d\'anomalies.'
  }
];

export const INITIAL_SYSTEM_ANOMALIES: SystemAnomaly[] = [
  {
    id: 'anom-101',
    severity: 'MOYENNE',
    module: 'Transport',
    title: 'Axe Abidjan -> Yamoussoukro à 98% de remplissage',
    aiDiagnostic: 'Affluence très élevée détectée pour le départ de 14h00. Risque de surréservation et d\'attente en gare d\'Adjamé.',
    timestamp: '2026-08-02 11:15',
    status: 'DETECTE',
    suggestedFix: 'Proposer l\'affectation d\'un autocar supplémentaire UTB Express VIP pour 14h30.'
  },
  {
    id: 'anom-102',
    severity: 'FAIBLE',
    module: 'Vision',
    title: 'Caméra Cam#04 (Parking Hôtel Ivoire) - Débit réseau instable',
    aiDiagnostic: 'Fluctuation de latence (240ms) détectée sur le flux RTSP. Risque d\'images saccadées lors des événements IA nocturnes.',
    timestamp: '2026-08-02 10:40',
    status: 'EN_COURS',
    suggestedFix: 'Basculer temporairement sur le sous-flux H.264 720p HD.'
  },
  {
    id: 'anom-103',
    severity: 'CRITIQUE',
    module: 'Paiements',
    title: 'Légère hausse des requêtes en attente Orange Money (2.4%)',
    aiDiagnostic: 'Temps de réponse du webhook Orange Money supérieur à 8 secondes sur les 15 dernières minutes.',
    timestamp: '2026-08-02 09:50',
    status: 'RESOLU',
    suggestedFix: 'Routage automatique prioritaire vers Wave et MTN Mobile Money.'
  }
];

export const INITIAL_TRANSVERSAL_PAYMENTS: TransversalPaymentTransaction[] = [
  {
    id: 'pay-001',
    module: 'Transport',
    reference: 'PAY-UTB-88219',
    amount: 10000,
    method: 'Wave',
    status: 'Succès',
    customerName: 'Kouassi Jean',
    customerPhone: '+225 07 08 09 10 11',
    timestamp: '2026-08-02 11:30'
  },
  {
    id: 'pay-002',
    module: 'Hôtellerie',
    reference: 'PAY-HOT-77123',
    amount: 45000,
    method: 'MTN Mobile Money',
    status: 'Succès',
    customerName: 'Aka Marie',
    customerPhone: '+225 05 04 03 02 01',
    timestamp: '2026-08-02 10:55'
  },
  {
    id: 'pay-003',
    module: 'Transport',
    reference: 'PAY-STT-44910',
    amount: 7000,
    method: 'Orange Money',
    status: 'Succès',
    customerName: 'Yao Ibrahim',
    customerPhone: '+225 01 02 03 04 05',
    timestamp: '2026-08-02 09:20'
  },
  {
    id: 'pay-004',
    module: 'Hôtellerie',
    reference: 'PAY-RES-99381',
    amount: 35000,
    method: 'Carte Bancaire',
    status: 'En attente',
    customerName: 'Bamba Sekou',
    customerPhone: '+225 07 44 55 66 77',
    timestamp: '2026-08-02 08:45'
  }
];

export const INITIAL_TRANSVERSAL_NOTIFS: TransversalNotificationLog[] = [
  {
    id: 'notif-501',
    channel: 'PUSH',
    recipient: 'Tous les voyageurs (Abidjan -> Yamoussoukro)',
    title: 'Rappel de départ imminent',
    body: 'Votre car UTB Express N°102 partira à 14h00 de la gare Adjamé VIP. Présentez votre QR code.',
    status: 'Envoyé',
    sentAt: '2026-08-02 11:00'
  },
  {
    id: 'notif-502',
    channel: 'EMAIL',
    recipient: 'gérant@hotel-ivoire.ci',
    title: 'Nouvelle Réservation Confirmée',
    body: 'Confirmation de réservation N° RES-HOT-CI-8812 pour M. Kouadio.',
    status: 'Envoyé',
    sentAt: '2026-08-02 10:30'
  },
  {
    id: 'notif-503',
    channel: 'SMS',
    recipient: '+225 07 08 09 10 11',
    title: 'Code Billet IVOIReXpress',
    body: 'Votre billet Abidjan-Yamoussoukro est validé. Code: TKT-2026-VIP. Bon voyage !',
    status: 'Envoyé',
    sentAt: '2026-08-02 09:15'
  }
];

export const INITIAL_PROPOSED_ACTIONS: AISmartAction[] = [
  {
    id: 'act-001',
    title: 'Programmer autocar supplémentaire Abidjan -> Yamoussoukro',
    description: 'En raison du taux d\'occupation de 98% sur la ligne de 14h00, l\'AI Core suggère l\'ouverture d\'un départ doublon à 14h30.',
    targetModule: 'Transport',
    actionType: 'ITINERARY_SUGGESTION',
    payload: {
      departureCity: 'Abidjan',
      arrivalCity: 'Yamoussoukro',
      agencyName: 'UTB Express',
      proposedTime: '14:30',
      price: 5000
    },
    requiresValidation: true,
    status: 'PROPOSED',
    createdAt: '2026-08-02 11:20'
  },
  {
    id: 'act-002',
    title: 'Proposer l\'Hôtel Résidence les Lagunes à San-Pédro',
    description: 'L\'utilisateur recherche un hébergement près du port. Tarifs négociés IVOIReXpress à 35 000 FCFA / nuit.',
    targetModule: 'Hôtellerie',
    actionType: 'HOTEL_RECOMMENDATION',
    payload: {
      hotelName: 'Hôtel Résidence les Lagunes',
      city: 'San-Pédro',
      pricePerNight: 35000,
      rating: 4.8
    },
    requiresValidation: true,
    status: 'PROPOSED',
    createdAt: '2026-08-02 10:45'
  },
  {
    id: 'act-003',
    title: 'Suggérer vérification caméra Cam#02 Gare Adjamé',
    description: 'L\'AI Core a détecté une légère obstruction visuelle temporaire suite aux mouvements sur le quai d\'embarquement.',
    targetModule: 'Vision',
    actionType: 'CAMERA_CHECK_SUGGESTION',
    payload: {
      cameraName: 'Cam#02 Quai 1',
      location: 'Gare Adjamé VIP',
      recommendedCheck: 'Nettoyage optique & vérification de la zone de détection'
    },
    requiresValidation: true,
    status: 'PROPOSED',
    createdAt: '2026-08-02 09:30'
  }
];
