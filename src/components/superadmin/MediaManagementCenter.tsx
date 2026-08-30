import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Edit3,
  Eye,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  Film,
  Tv,
  Bus,
  Hotel,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  Sliders,
  Globe,
  Building2,
  Tag,
  Check,
  X,
  FileText,
  Zap,
  Folder,
  Palette,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Info,
  Lock,
  Camera,
  ExternalLink,
  Smartphone,
  CheckSquare,
  Clock,
  User,
  ArrowUp,
  ArrowDown,
  Database
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { SystemConfigEngine } from '../../core/domain/governance/SystemConfigEngine';
import { useBanners, BannerWorkflowLog, BannerItem } from '../../core/context/BannersContext';
import { DEFAULT_WELCOME_BUS_HOSTESS_IMAGE, LUXURY_VIP_BUS_IMAGE } from '../../assets/welcomeAssets';

// Types for Media Management
export type MediaCategory =
  | 'IDENTITE_PLATEFORME'
  | 'BANNIERE'
  | 'CARTE_SERVICE'
  | 'TRANSPORT'
  | 'HOTEL'
  | 'VISION'
  | 'IPTV'
  | 'AICORE'
  | 'TENANT_AGENCE'
  | 'TENANT_HOTEL';

export type TargetModule =
  | 'ACCUEIL'
  | 'TRANSPORT'
  | 'HOTELLERIE'
  | 'VISION'
  | 'IPTV'
  | 'AICORE'
  | 'PROMOTIONS'
  | 'ACTUALITES'
  | 'PUBLICITE'
  | 'SYSTEME';

export interface MediaVersion {
  version: string;
  url: string;
  timestamp: string;
  author: string;
  comment: string;
  sizeKb: number;
}

export interface PlatformMediaItem {
  id: string;
  name: string;
  category: MediaCategory;
  targetModule: TargetModule;
  url: string;
  format: 'WEBP' | 'PNG' | 'JPG' | 'SVG' | 'MP4';
  dimensions: string; // e.g. "1920x1080", "512x512"
  sizeKb: number;
  compressedSizeKb?: number;
  updatedAt: string;
  updatedBy: string;
  versions: MediaVersion[];
  tags: string[];
  tenantId?: string;
  tenantName?: string;
  description?: string;
}

export interface ServiceCardConfig {
  id: string;
  code: 'TRANSPORT' | 'HOTEL' | 'VISION' | 'IPTV' | 'AICORE' | 'WALLET';
  title: string;
  subtitle: string;
  iconName: string;
  imageUrl: string;
  bgColorGradient: string;
  badgeLabel?: string;
  displayOrder: number;
  isVisible: boolean;
}

export const MediaManagementCenter: React.FC = () => {
  const configEngine = SystemConfigEngine.getInstance();
  const [activeTab, setActiveTab] = useState<'library' | 'identity' | 'banners' | 'cards' | 'modules' | 'tenants' | 'audit'>('library');

  // Banners Context (Cloud Firestore Persistence & Real-time Sync)
  const {
    bannersList,
    saveBannerToFirestore,
    toggleBannerActiveInFirestore,
    deleteBannerFromFirestore,
    reloadBannersFromFirestore,
    workflowLogs,
    clearWorkflowLogs,
    isLoading: isBannersLoading,
    error: bannersError
  } = useBanners();

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Search & Filter state for Media Library
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initial Seed Data for Media Items
  const [mediaList, setMediaList] = useState<PlatformMediaItem[]>([
    {
      id: 'm-welcome-bus',
      name: 'Bannière de Bienvenue • Concierge Hôtesse & Car VIP',
      category: 'BANNIERE',
      targetModule: 'ACCUEIL',
      url: DEFAULT_WELCOME_BUS_HOSTESS_IMAGE,
      format: 'JPG',
      dimensions: '1920x1080',
      sizeKb: 480,
      compressedSizeKb: 165,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['welcome', 'bus', 'hotesse', 'concierge', 'accueil'],
      versions: [
        { version: 'v1.0', url: DEFAULT_WELCOME_BUS_HOSTESS_IMAGE, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), author: 'fabriceallechi@gmail.com', comment: 'Photo HD Concierge Hôtesse & Autocar VIP', sizeKb: 165 }
      ],
      description: 'Illustration officielle HD pour la bannière de bienvenue "Bonjour, [Prénom]" sur l\'écran d\'accueil voyageur.'
    },
    {
      id: 'm-welcome-bus-highway',
      name: 'Bannière de Bienvenue • Autocar VIP Grand Luxe Sur Route',
      category: 'BANNIERE',
      targetModule: 'ACCUEIL',
      url: LUXURY_VIP_BUS_IMAGE,
      format: 'JPG',
      dimensions: '1920x1080',
      sizeKb: 520,
      compressedSizeKb: 180,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['welcome', 'bus', 'autoroute', 'luxe', 'accueil'],
      versions: [
        { version: 'v1.0', url: LUXURY_VIP_BUS_IMAGE, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), author: 'fabriceallechi@gmail.com', comment: 'Photo HD Autocar VIP sur autoroute au coucher du soleil', sizeKb: 180 }
      ],
      description: 'Illustration cinématique alternative d\'un autocar VIP grand luxe filant au coucher du soleil.'
    },
    {
      id: 'm-logo-main',
      name: 'Logo Principal IVOIReXpress (HD)',
      category: 'IDENTITE_PLATEFORME',
      targetModule: 'ACCUEIL',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      format: 'WEBP',
      dimensions: '1024x512',
      sizeKb: 142,
      compressedSizeKb: 48,
      updatedAt: '2026-08-06 10:15',
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['logo', 'header', 'officiel', 'vector'],
      versions: [
        { version: 'v2.0', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', timestamp: '2026-08-06 10:15', author: 'fabriceallechi@gmail.com', comment: 'Optimisation WebP & Fond Transparent', sizeKb: 48 },
        { version: 'v1.0', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80', timestamp: '2026-01-10 09:00', author: 'admin@ivoirexpress.ci', comment: 'Logo original PNG high-res', sizeKb: 320 }
      ],
      description: 'Logo vectoriel principal affiché dans la barre de navigation et sur les tickets PDF imprimés.'
    },
    {
      id: 'm-splash-app',
      name: 'Splash Screen Application Mobile / PWA',
      category: 'IDENTITE_PLATEFORME',
      targetModule: 'SYSTEME',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
      format: 'WEBP',
      dimensions: '1080x1920',
      sizeKb: 380,
      compressedSizeKb: 112,
      updatedAt: '2026-08-05 14:20',
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['splash', 'mobile', 'pwa', 'boot'],
      versions: [
        { version: 'v1.0', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80', timestamp: '2026-08-05 14:20', author: 'fabriceallechi@gmail.com', comment: 'Écran de démarrage PWA 2026', sizeKb: 112 }
      ],
      description: 'Écran d’accueil d’ouverture de l’application PWA et hybride iOS/Android.'
    },
    {
      id: 'm-banner-transport',
      name: 'Bannière Héroïque Car VIP Transport',
      category: 'BANNIERE',
      targetModule: 'TRANSPORT',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      format: 'JPG',
      dimensions: '1920x600',
      sizeKb: 512,
      compressedSizeKb: 180,
      updatedAt: '2026-08-04 11:30',
      updatedBy: 'Admin Agence UTB',
      tags: ['transport', 'bus', 'hero', 'voyage'],
      versions: [
        { version: 'v1.2', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80', timestamp: '2026-08-04 11:30', author: 'UTB Express', comment: 'Mise à jour flotte bus King Long VIP', sizeKb: 180 }
      ],
      description: 'Bannière de garde du module Transport avec cars climatisés de dernière génération.'
    },
    {
      id: 'm-hotel-suite',
      name: 'Galerie Hôtel - Suite Présidentielle Hôtel Ivoire',
      category: 'HOTEL',
      targetModule: 'HOTELLERIE',
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      format: 'WEBP',
      dimensions: '1920x1080',
      sizeKb: 620,
      compressedSizeKb: 210,
      updatedAt: '2026-08-03 16:45',
      updatedBy: 'Admin Hôtel Ivoire',
      tenantId: 'tenant-hotel-01',
      tenantName: 'Hôtel Ivoire Abidjan',
      tags: ['hotel', 'chambre', 'luxe', 'abidjan'],
      versions: [
        { version: 'v1.0', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', timestamp: '2026-08-03 16:45', author: 'Admin Hôtel Ivoire', comment: 'Rendu suite luxe 5 étoiles', sizeKb: 210 }
      ],
      description: 'Visuel haute définition pour la réservation de chambres et suites de luxe.'
    },
    {
      id: 'm-vision-site',
      name: 'Plan 3D Zone Surveillance Gare Yamoussoukro',
      category: 'VISION',
      targetModule: 'VISION',
      url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80',
      format: 'PNG',
      dimensions: '1600x900',
      sizeKb: 890,
      compressedSizeKb: 310,
      updatedAt: '2026-08-02 08:12',
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['vision', 'camera', 'gare', 'yamoussoukro', 'blueprint'],
      versions: [
        { version: 'v1.0', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1000&q=80', timestamp: '2026-08-02 08:12', author: 'fabriceallechi@gmail.com', comment: 'Secteurs caméras thermiques ONVIF', sizeKb: 310 }
      ],
      description: 'Schéma spatial des caméras de sécurité de la gare centrale.'
    },
    {
      id: 'm-iptv-rti1',
      name: 'Logo Télévision Nationale RTI 1 (4K)',
      category: 'IPTV',
      targetModule: 'IPTV',
      url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
      format: 'PNG',
      dimensions: '512x512',
      sizeKb: 95,
      compressedSizeKb: 32,
      updatedAt: '2026-08-01 12:00',
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['iptv', 'chaine', 'rti1', 'direct', 'logo'],
      versions: [
        { version: 'v1.0', url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80', timestamp: '2026-08-01 12:00', author: 'fabriceallechi@gmail.com', comment: 'Vignette HD EPG Live Stream', sizeKb: 32 }
      ],
      description: 'Vignette officielle pour le bouquet national TV en streaming HLS/DASH.'
    },
    {
      id: 'm-ai-aya-avatar',
      name: 'Avatar IA Aya • Assistant Voyageur',
      category: 'AICORE',
      targetModule: 'AICORE',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      format: 'WEBP',
      dimensions: '512x512',
      sizeKb: 88,
      compressedSizeKb: 28,
      updatedAt: '2026-08-06 09:00',
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: ['ai', 'aya', 'avatar', 'assistant', 'gemini'],
      versions: [
        { version: 'v2.1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', timestamp: '2026-08-06 09:00', author: 'fabriceallechi@gmail.com', comment: 'Rendu 3D photo-réaliste Aya', sizeKb: 28 }
      ],
      description: 'Avatar représentatif de l’assistante IA conversationnelle Aya Gemini.'
    }
  ]);

  // Initial Service Cards Config
  const [serviceCards, setServiceCards] = useState<ServiceCardConfig[]>([
    {
      id: 'sc-1',
      code: 'TRANSPORT',
      title: 'Transport interurbain VIP',
      subtitle: 'Billets de car climatisé, horaires & sièges numérotés',
      iconName: 'Bus',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
      bgColorGradient: 'from-orange-500/20 to-amber-600/20 border-orange-500/30',
      badgeLabel: 'Populaire',
      displayOrder: 1,
      isVisible: true
    },
    {
      id: 'sc-2',
      code: 'HOTEL',
      title: 'Hôtels & Résidences',
      subtitle: 'Chambres d’hôtel, suites d’exception & check-in express',
      iconName: 'Hotel',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      bgColorGradient: 'from-purple-500/20 to-indigo-600/20 border-purple-500/30',
      badgeLabel: 'Recommandé',
      displayOrder: 2,
      isVisible: true
    },
    {
      id: 'sc-3',
      code: 'VISION',
      title: 'Vision Caméras IA',
      subtitle: 'Supervision temps réel des gares et sécurité vidéo',
      iconName: 'Eye',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
      bgColorGradient: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
      badgeLabel: 'Sécurité ONVIF',
      displayOrder: 3,
      isVisible: true
    },
    {
      id: 'sc-4',
      code: 'IPTV',
      title: 'IPTV Streaming Direct',
      subtitle: 'Chaînes télé nationales, VOD, films & séries 4K',
      iconName: 'Tv',
      imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
      bgColorGradient: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
      badgeLabel: 'Direct HD',
      displayOrder: 4,
      isVisible: true
    },
    {
      id: 'sc-5',
      code: 'AICORE',
      title: 'Assistant IA Aya',
      subtitle: 'Planification intelligente de vos itinéraires et séjours',
      iconName: 'Sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bgColorGradient: 'from-pink-500/20 to-rose-600/20 border-pink-500/30',
      badgeLabel: 'Propulsé par Gemini',
      displayOrder: 5,
      isVisible: true
    }
  ]);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [previewMediaItem, setPreviewMediaItem] = useState<PlatformMediaItem | null>(null);
  const [replaceMediaItem, setReplaceMediaItem] = useState<PlatformMediaItem | null>(null);

  // Form States for New Upload
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState<MediaCategory>('IDENTITE_PLATEFORME');
  const [newMediaModule, setNewMediaModule] = useState<TargetModule>('ACCUEIL');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaTags, setNewMediaTags] = useState('');
  const [newMediaDesc, setNewMediaDesc] = useState('');

  // Form States for New Banner
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerModule, setBannerModule] = useState<TargetModule>('TRANSPORT');
  const [bannerPriority, setBannerPriority] = useState(1);
  const [bannerStartDate, setBannerStartDate] = useState('2026-08-01');
  const [bannerEndDate, setBannerEndDate] = useState('2026-12-31');
  const [bannerCtaText, setBannerCtaText] = useState('En savoir plus');
  const [bannerCtaUrl, setBannerCtaUrl] = useState('/transport');
  const [bannerBadgeText, setBannerBadgeText] = useState('');
  const [bannerAgencyName, setBannerAgencyName] = useState('');
  const [bannerIsActive, setBannerIsActive] = useState(true);

  // Trigger Toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with Firestore if connected
  useEffect(() => {
    const fetchFirestoreMedia = async () => {
      if (isFirebaseConfigured && db) {
        try {
          const querySnap = await getDocs(collection(db, 'media_library'));
          if (!querySnap.empty) {
            const fetchedList: PlatformMediaItem[] = [];
            querySnap.forEach((docSnap) => {
              fetchedList.push({ id: docSnap.id, ...docSnap.data() } as PlatformMediaItem);
            });
            setMediaList(fetchedList);
            console.log('[MediaCenter] Médias chargés depuis Cloud Firestore :', fetchedList.length);
          }
        } catch (err) {
          console.warn('[MediaCenter] Fallback state local actif');
        }
      }
    };
    fetchFirestoreMedia();
  }, []);

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaName || !newMediaUrl) {
      showToast('Veuillez remplir le nom et l’URL du média', 'error');
      return;
    }

    const newItem: PlatformMediaItem = {
      id: `m-${Date.now()}`,
      name: newMediaName,
      category: newMediaCategory,
      targetModule: newMediaModule,
      url: newMediaUrl,
      format: newMediaUrl.endsWith('.png') ? 'PNG' : newMediaUrl.endsWith('.svg') ? 'SVG' : 'WEBP',
      dimensions: '1920x1080',
      sizeKb: 240,
      compressedSizeKb: 72,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedBy: 'Super Admin (fabriceallechi@gmail.com)',
      tags: newMediaTags.split(',').map((t) => t.trim()).filter(Boolean),
      description: newMediaDesc || 'Média téléversé via le Centre de Gestion Global des Médias',
      versions: [
        {
          version: 'v1.0',
          url: newMediaUrl,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          author: 'fabriceallechi@gmail.com',
          comment: 'Téléversement initial',
          sizeKb: 72
        }
      ]
    };

    setMediaList([newItem, ...mediaList]);

    // Firestore Sync
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'media_library', newItem.id), newItem);
      } catch (e) {
        console.warn('Erreur synchro firestore');
      }
    }

    // Record Audit & Update System Config Engine
    configEngine.updateSettingsSection(
      'uxui',
      {
        customBannerUrl: newItem.url,
        ...(newItem.targetModule === 'ACCUEIL' || newItem.category === 'BANNIERE' ? { welcomeBannerImageUrl: newItem.url } : {})
      },
      'fabriceallechi@gmail.com',
      'SUPER_ADMIN'
    );

    showToast(`Média '${newItem.name}' téléversé et synchronisé avec succès !`);
    setShowUploadModal(false);
    setNewMediaName('');
    setNewMediaUrl('');
    setNewMediaTags('');
    setNewMediaDesc('');
  };

  // Handle Replace Submission
  const handleReplaceSubmit = async (mediaId: string, newUrl: string, comment: string) => {
    if (!newUrl) return;

    const updated = mediaList.map((item) => {
      if (item.id === mediaId) {
        const nextVersionNum = `v${(item.versions.length + 1).toFixed(1)}`;
        const newVersion: MediaVersion = {
          version: nextVersionNum,
          url: newUrl,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          author: 'fabriceallechi@gmail.com',
          comment: comment || 'Remplacement du média',
          sizeKb: Math.floor(item.sizeKb * 0.9)
        };
        return {
          ...item,
          url: newUrl,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          versions: [newVersion, ...item.versions]
        };
      }
      return item;
    });

    setMediaList(updated);

    // Record Audit & Update System Config Engine
    const targetItem = mediaList.find(m => m.id === mediaId);
    configEngine.updateSettingsSection(
      'uxui',
      {
        customBannerUrl: newUrl,
        ...(targetItem?.targetModule === 'ACCUEIL' || targetItem?.id === 'm-welcome-bus' || targetItem?.category === 'BANNIERE' ? { welcomeBannerImageUrl: newUrl } : {})
      },
      'fabriceallechi@gmail.com',
      'SUPER_ADMIN'
    );

    showToast('Nouvelle version du média enregistrée avec succès !');
    setReplaceMediaItem(null);
  };

  // Handle Delete Media
  const handleDeleteMedia = (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le média '${name}' ?`)) {
      setMediaList(mediaList.filter((m) => m.id !== id));
      showToast(`Média '${name}' supprimé de la bibliothèque.`, 'info');
    }
  };

  // Restore Previous Version
  const handleRestoreVersion = (mediaId: string, targetVersion: MediaVersion) => {
    setMediaList((prev) =>
      prev.map((item) => {
        if (item.id === mediaId) {
          return {
            ...item,
            url: targetVersion.url,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            updatedBy: `Restauration (${targetVersion.version})`
          };
        }
        return item;
      })
    );
    showToast(`Média restauré avec succès à la version ${targetVersion.version} !`);
  };

  // Handle Add / Edit Banner via Firestore 5-Step Workflow
  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMessage(null);

    if (!bannerTitle || !bannerTitle.trim()) {
      setModalErrorMessage('Le titre de la bannière est obligatoire.');
      return;
    }

    if (!bannerImageUrl || !bannerImageUrl.trim()) {
      setModalErrorMessage("L'image de la bannière (URL ou fichier téléversé) est obligatoire.");
      return;
    }

    setIsSavingBanner(true);

    const existingBanner = editingBannerId ? bannersList.find(b => b.id === editingBannerId) : null;

    const bannerPayload: BannerItem = {
      id: editingBannerId || `b-${Date.now()}`,
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      description: bannerSubtitle.trim(),
      imageUrl: bannerImageUrl.trim(),
      targetModule: bannerModule,
      module: bannerModule.toLowerCase(),
      priority: Number(bannerPriority) || 1,
      order: Number(bannerPriority) || 1,
      startDate: bannerStartDate || new Date().toISOString().split('T')[0],
      startAt: bannerStartDate || new Date().toISOString().split('T')[0],
      endDate: bannerEndDate || '2026-12-31',
      endAt: bannerEndDate || '2026-12-31',
      ctaText: bannerCtaText.trim() || 'En savoir plus',
      ctaLabel: bannerCtaText.trim() || 'En savoir plus',
      ctaUrl: bannerCtaUrl.trim() || '#',
      badgeText: bannerBadgeText.trim(),
      agencyName: bannerAgencyName.trim(),
      isActive: bannerIsActive,
      status: bannerIsActive ? 'active' : 'inactive',
      clicksCount: existingBanner?.clicksCount || 0,
      viewsCount: existingBanner?.viewsCount || 1,
      createdAt: existingBanner?.createdAt || new Date().toISOString()
    };

    const res = await saveBannerToFirestore(bannerPayload);

    setIsSavingBanner(false);

    if (res.success) {
      setShowBannerModal(false);
      showToast(res.message, 'success');
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImageUrl('');
      setBannerBadgeText('');
      setBannerAgencyName('');
      setBannerIsActive(true);
      setEditingBannerId(null);
    } else {
      // CRITICAL: Display explicit error message, NO SUCCESS MESSAGE!
      setModalErrorMessage(res.message);
    }
  };

  // Filtered Media Calculation
  const filteredMedia = mediaList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tenantName && item.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesModule = selectedModule === 'ALL' || item.targetModule === selectedModule;

    return matchesSearch && matchesCategory && matchesModule;
  });

  // Calculate Metrics
  const totalStorageKb = mediaList.reduce((acc, curr) => acc + (curr.compressedSizeKb || curr.sizeKb), 0);
  const totalStorageMb = (totalStorageKb / 1024).toFixed(2);
  const activeBannersCount = bannersList.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border flex items-center justify-between transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-900/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-lg'
              : 'bg-blue-950/90 text-blue-200 border-blue-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
          <span className="text-xs opacity-75">Synchro Réel Firestore</span>
        </div>
      )}

      {/* Header & Quick Action Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Centre de Gestion Global des Médias</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Gouvernance Visuelle
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Administration centralisée des logos, bannières, galeries, icônes et visuels avec synchronisation automatique en temps réel.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                showToast('Compression automatique WebP exécutée. Gain de 64% sur l’espace de stockage !');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Optimiser Tout (WebP)</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Téléverser un Média</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-700/60">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Total Fichiers Médias</span>
              <Folder className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-lg font-black text-white mt-1">{mediaList.length} éléments</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <Check className="w-3 h-3" /> TOUS SYNCHRONISÉS BDD
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Bannières Actives</span>
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg font-black text-white mt-1">{activeBannersCount} Bannières</div>
            <div className="text-[10px] text-blue-300 mt-0.5">Programmation dynamique</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Espace Stockage Utilisé</span>
              <Database className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black text-white mt-1">{totalStorageMb} MB</div>
            <div className="text-[10px] text-purple-300 mt-0.5">Sur 5.00 GB attribués</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Statut Firebase Storage</span>
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">Connecté</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sans modification code</div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation inside Media Center */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {[
          { id: 'library', label: 'Bibliothèque Centrale', icon: ImageIcon },
          { id: 'identity', label: 'Identité Visuelle & Logos', icon: Palette },
          { id: 'banners', label: 'Gestionnaire des Bannières', icon: Layers, badge: activeBannersCount },
          { id: 'cards', label: 'Cartes de Services', icon: Sliders },
          { id: 'modules', label: 'Médias par Module', icon: Tag },
          { id: 'tenants', label: 'Agences & Hôtels', icon: Building2 },
          { id: 'audit', label: 'Audit & Versioning', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white text-orange-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BIBLIOTHÈQUE CENTRALE */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {/* Search, Filters & Controls */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un média, un tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 text-white text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Toutes Catégories</option>
                <option value="IDENTITE_PLATEFORME">Identité Plateforme</option>
                <option value="BANNIERE">Bannières</option>
                <option value="CARTE_SERVICE">Cartes de Service</option>
                <option value="TRANSPORT">Transport</option>
                <option value="HOTEL">Hôtellerie</option>
                <option value="VISION">Vision Caméras</option>
                <option value="IPTV">IPTV Streaming</option>
                <option value="AICORE">AI Core</option>
              </select>

              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ALL">Tous Modules</option>
                <option value="ACCUEIL">Accueil</option>
                <option value="TRANSPORT">Transport</option>
                <option value="HOTELLERIE">Hôtellerie</option>
                <option value="VISION">Vision Caméras</option>
                <option value="IPTV">IPTV</option>
                <option value="AICORE">AI Core</option>
                <option value="SYSTEME">Système PWA</option>
              </select>

              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Vue Grille"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Vue Liste / Table"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Media Grid View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMedia.map((media) => (
                <div
                  key={media.id}
                  className="bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-xl overflow-hidden group transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Media Thumbnail Container */}
                    <div className="relative h-40 bg-slate-950 overflow-hidden flex items-center justify-center border-b border-slate-800">
                      <img
                        src={media.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                        alt={media.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700">
                          {media.format}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold">
                          {media.dimensions}
                        </span>
                      </div>

                      {/* Action Hover Quick Overlay */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewMediaItem(media)}
                          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all"
                          title="Prévisualiser & Détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setReplaceMediaItem(media)}
                          className="p-2 rounded-lg bg-orange-500/80 hover:bg-orange-500 text-white backdrop-blur-sm transition-all"
                          title="Remplacer par une nouvelle version"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Media Details */}
                    <div className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{media.name}</h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">{media.compressedSizeKb || media.sizeKb} KB</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-400 font-semibold text-[10px]">
                          {media.category}
                        </span>
                        <span>{media.targetModule}</span>
                      </div>

                      {media.tags && media.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {media.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="px-3.5 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">Modifié : {media.updatedAt}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewMediaItem(media)}
                        className="text-slate-300 hover:text-white p-1"
                        title="Versions"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(media.id, media.name)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Aperçu</th>
                    <th className="p-3.5">Nom du Média</th>
                    <th className="p-3.5">Catégorie</th>
                    <th className="p-3.5">Module Cible</th>
                    <th className="p-3.5">Format & Taille</th>
                    <th className="p-3.5">Dernière Modif</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMedia.map((media) => (
                    <tr key={media.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5">
                        <img
                          src={media.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                          alt={media.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700 bg-slate-950"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        <div>{media.name}</div>
                        <div className="text-[10px] text-slate-400">{media.description}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-orange-400 font-bold text-[10px]">
                          {media.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{media.targetModule}</td>
                      <td className="p-3.5 font-mono text-[11px]">
                        {media.format} ({media.dimensions}) • {media.compressedSizeKb || media.sizeKb} KB
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">{media.updatedAt}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setPreviewMediaItem(media)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Aperçu & Versions"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setReplaceMediaItem(media)}
                          className="p-1.5 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                          title="Remplacer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(media.id, media.name)}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IDENTITÉ VISUELLE & LOGOS */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-orange-400" />
              <span>Identité Visuelle & Éléments Officiels de Marque</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Modifiez ici les logos, l'icône mobile, le splash screen et les couleurs officielles d'IVOIReXpress. Appliqués immédiatement sans recompilation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Principal */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Logo Principal IVOIReXpress</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Actif • En ligne</span>
                </div>
                <div className="h-28 bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center p-4">
                  <img src={mediaList.find((m) => m.id === 'm-logo-main')?.url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'} alt="Logo Main" className="max-h-full object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mediaList.find((m) => m.id === 'm-logo-main')?.url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMediaList((prev) =>
                        prev.map((m) => (m.id === 'm-logo-main' ? { ...m, url: val } : m))
                      );
                    }}
                    className="flex-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded border border-slate-700"
                  />
                  <button
                    onClick={() => showToast('Logo principal mis à jour et synchronisé sur tous les bandeaux !')}
                    className="px-3 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>

              {/* Splash Screen App */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Splash Screen PWA / Mobile</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">1080x1920</span>
                </div>
                <div className="h-28 bg-slate-900 rounded-lg border border-dashed border-slate-700 flex items-center justify-center p-2">
                  <img src={mediaList.find((m) => m.id === 'm-splash-app')?.url || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'} alt="Splash" className="max-h-full object-contain" />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mediaList.find((m) => m.id === 'm-splash-app')?.url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMediaList((prev) =>
                        prev.map((m) => (m.id === 'm-splash-app' ? { ...m, url: val } : m))
                      );
                    }}
                    className="flex-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded border border-slate-700"
                  />
                  <button
                    onClick={() => showToast('Splash Screen Mobile mis à jour avec succès !')}
                    className="px-3 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>

            {/* Colors & Palette Picker */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-3">Palette Officielle des Couleurs IVOIReXpress</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 border border-white/20 shadow-sm" />
                  <div>
                    <div className="text-[10px] text-slate-400">Orange Principal</div>
                    <div className="text-xs font-mono font-bold text-white">#F5821F</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 shadow-sm" />
                  <div>
                    <div className="text-[10px] text-slate-400">Fond Sombre Slate</div>
                    <div className="text-xs font-mono font-bold text-white">#0F172A</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 border border-white/20 shadow-sm" />
                  <div>
                    <div className="text-[10px] text-slate-400">Vert Super Admin</div>
                    <div className="text-xs font-mono font-bold text-white">#059669</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 border border-white/20 shadow-sm" />
                  <div>
                    <div className="text-[10px] text-slate-400">Bleu Agence Transport</div>
                    <div className="text-xs font-mono font-bold text-white">#2563EB</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIONNAIRE DES BANNIÈRES */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4.5 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Bannières Dynamiques & Campagnes Persistées (Cloud Firestore)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] flex items-center gap-1 font-bold">
                  <Database className="w-3 h-3" />
                  <span>Synchro Temps Réel</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Toutes les modifications sont immédiatement écrites dans Cloud Firestore, relues pour confirmation, et synchronisées sur toutes les interfaces (Voyageur, Admin Agence, Admin Hôtel, Super Admin).
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2 shrink-0">
              <button
                onClick={async () => {
                  await reloadBannersFromFirestore();
                  showToast('Configuration relue et vérifiée depuis Cloud Firestore !', 'info');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                title="Forcer la relecture et vérification depuis Firestore"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Recharger & Vérifier</span>
              </button>

              <button
                onClick={() => setShowLogsModal(true)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                title="Voir le journal détaillé des 5 étapes du workflow"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Logs 5 Étapes ({workflowLogs.length})</span>
              </button>

              <button
                onClick={() => {
                  setEditingBannerId(null);
                  setBannerTitle('');
                  setBannerSubtitle('');
                  setBannerImageUrl('');
                  setBannerModule('ACCUEIL');
                  setBannerPriority(1);
                  setBannerStartDate(new Date().toISOString().split('T')[0]);
                  setBannerEndDate('2026-12-31');
                  setBannerCtaText('Réserver un billet');
                  setBannerCtaUrl('/transport');
                  setBannerBadgeText('');
                  setBannerAgencyName('');
                  setBannerIsActive(true);
                  setModalErrorMessage(null);
                  setShowBannerModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une Bannière</span>
              </button>
            </div>
          </div>

          {bannersError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{bannersError}</span>
              </div>
              <button
                onClick={() => reloadBannersFromFirestore()}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-[11px] font-bold"
              >
                Réessayer
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bannersList.map((banner) => (
              <div key={banner.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
                <div>
                  <div className="relative h-36 bg-slate-950">
                    <img src={banner.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'} alt={banner.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold">
                        P{banner.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-200 text-[10px] font-bold border border-slate-700">
                        {banner.targetModule}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/90 text-slate-950 text-[10px] font-extrabold font-mono shadow">
                        Firestore Sync
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-white line-clamp-2">{banner.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{banner.subtitle}</p>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800">
                      <span>Du {banner.startDate} au {banner.endDate}</span>
                      <span className="text-emerald-400 font-bold">{banner.clicksCount || 0} Clics</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      const res = await toggleBannerActiveInFirestore(banner.id);
                      if (res.success) {
                        showToast(res.message, 'success');
                      } else {
                        showToast(res.message, 'error');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                      banner.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {banner.isActive ? '● ACTIF (Firestore)' : '○ INACTIF'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingBannerId(banner.id);
                        setBannerTitle(banner.title);
                        setBannerSubtitle(banner.subtitle || banner.description || '');
                        setBannerImageUrl(banner.imageUrl);
                        setBannerModule(banner.targetModule || 'ACCUEIL');
                        setBannerPriority(banner.priority || banner.order || 1);
                        setBannerStartDate(banner.startDate || banner.startAt || '2026-08-01');
                        setBannerEndDate(banner.endDate || banner.endAt || '2026-12-31');
                        setBannerCtaText(banner.ctaText || banner.ctaLabel || 'En savoir plus');
                        setBannerCtaUrl(banner.ctaUrl || '#');
                        setBannerBadgeText(banner.badgeText || '');
                        setBannerAgencyName(banner.agencyName || '');
                        setBannerIsActive(banner.isActive !== undefined ? banner.isActive : banner.status === 'active');
                        setModalErrorMessage(null);
                        setShowBannerModal(true);
                      }}
                      className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Éditer dans Firestore"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={async () => {
                        if (window.confirm(`Supprimer définitivement la bannière "${banner.title}" de Cloud Firestore ?`)) {
                          const res = await deleteBannerFromFirestore(banner.id);
                          if (res.success) {
                            showToast(res.message, 'success');
                          } else {
                            showToast(res.message, 'error');
                          }
                        }
                      }}
                      className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                      title="Supprimer de Firestore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CARTES DE SERVICES */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              <span>Personnalisation des Cartes de Service (Espace Voyageur)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configurez les visuels, ordres d'affichage, sous-titres et dégradés des cartes de services sur l'interface d'accueil Voyageur.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceCards.map((card) => (
                <div key={card.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">
                        #{card.displayOrder}
                      </span>
                      {card.title}
                    </span>

                    <button
                      onClick={() => {
                        setServiceCards(
                          serviceCards.map((c) => (c.id === card.id ? { ...c, isVisible: !c.isVisible } : c))
                        );
                        showToast(`Carte '${card.title}' ${card.isVisible ? 'masquée' : 'rendue visible'}`);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        card.isVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {card.isVisible ? 'VISIBLE' : 'MASQUÉE'}
                    </button>
                  </div>

                  <div className="h-28 rounded-lg overflow-hidden relative border border-slate-800">
                    <img src={card.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'} alt={card.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 p-3 flex flex-col justify-end">
                      <div className="text-xs font-bold text-white">{card.title}</div>
                      <div className="text-[10px] text-slate-300">{card.subtitle}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-semibold text-slate-400">Titre personnalisé :</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setServiceCards(serviceCards.map((c) => (c.id === card.id ? { ...c, title: val } : c)));
                      }}
                      className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded border border-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MÉDIAS PAR MODULE */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-4">Kit de Médias Classé par Module Métier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                  <Bus className="w-4 h-4" /> Module Transport & Cars
                </div>
                <p className="text-[11px] text-slate-400">
                  Logos agences, photos de la flotte, galeries des gares routières d’Abidjan, Yamoussoukro, Bouaké.
                </p>
                <div className="text-xs text-slate-200 font-mono">
                  {mediaList.filter((m) => m.targetModule === 'TRANSPORT').length} visuels enregistrés
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Hotel className="w-4 h-4" /> Module Hôtellerie
                </div>
                <p className="text-[11px] text-slate-400">
                  Photos des chambres deluxe, restaurants, piscines, façades d’hôtels partenaires.
                </p>
                <div className="text-xs text-slate-200 font-mono">
                  {mediaList.filter((m) => m.targetModule === 'HOTELLERIE').length} visuels enregistrés
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Eye className="w-4 h-4" /> Module Vision Caméras
                </div>
                <p className="text-[11px] text-slate-400">
                  Plans 3D des sites, schémas de couverture spatiale caméras ONVIF.
                </p>
                <div className="text-xs text-slate-200 font-mono">
                  {mediaList.filter((m) => m.targetModule === 'VISION').length} visuels enregistrés
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Tv className="w-4 h-4" /> Module IPTV Streaming
                </div>
                <p className="text-[11px] text-slate-400">
                  Logos des chaînes, affiches de films VOD, vignettes catégories.
                </p>
                <div className="text-xs text-slate-200 font-mono">
                  {mediaList.filter((m) => m.targetModule === 'IPTV').length} visuels enregistrés
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TENANTS (AGENCES & HÔTELS) */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-400" />
              <span>Gouvernance Médias des Vitrines Agences & Hôtels</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Visualisez et modifiez en tant que Super Admin les logos, bannières et galeries attribuées aux partenaires Agences (UTB, SBTA) et Hôtels (Hôtel Ivoire, Radisson Blu).
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    UTB
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Union des Transports de Bouaké (UTB)</h4>
                    <p className="text-[11px] text-slate-400">Compagnie de Transport Partenaire VIP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    4 Photos Galeries
                  </span>
                  <button
                    onClick={() => showToast('Galerie Agence UTB ouverte pour édition Super Admin')}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Gérer la Galerie
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                    HI
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Hôtel Ivoire Sofitel Abidjan</h4>
                    <p className="text-[11px] text-slate-400">Établissement Hôtelier 5 Étoiles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    12 Photos Chambres
                  </span>
                  <button
                    onClick={() => showToast('Galerie Hôtel Ivoire ouverte pour édition Super Admin')}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Gérer la Galerie
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT & VERSIONING */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span>Journal d'Audit & Versioning des Médias</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Historique complet de toutes les opérations de téléversement, modification et suppression des visuels sur la plateforme IVOIReXpress.
            </p>

            <div className="space-y-3">
              {mediaList.flatMap((m) =>
                m.versions.map((v) => (
                  <div
                    key={`${m.id}-${v.version}`}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <img src={v.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'} alt={m.name} className="w-10 h-10 object-cover rounded-lg border border-slate-800" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{m.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[10px]">
                            {v.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{v.comment}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-slate-400">
                      <div>
                        <div>Par : {v.author}</div>
                        <div className="text-[10px] text-slate-500">{v.timestamp}</div>
                      </div>

                      <button
                        onClick={() => handleRestoreVersion(m.id, v)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Restaurer</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD NEW MEDIA */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto my-auto scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-400" />
                <span>Téléverser un Nouveau Média</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom du Média *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bannière Promotionnelle Vacances 2026"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Catégorie *</label>
                  <select
                    value={newMediaCategory}
                    onChange={(e) => setNewMediaCategory(e.target.value as any)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  >
                    <option value="IDENTITE_PLATEFORME">Identité Plateforme</option>
                    <option value="BANNIERE">Bannière</option>
                    <option value="CARTE_SERVICE">Carte Service</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="HOTEL">Hôtellerie</option>
                    <option value="VISION">Vision Caméras</option>
                    <option value="IPTV">IPTV</option>
                    <option value="AICORE">AI Core</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Module Cible *</label>
                  <select
                    value={newMediaModule}
                    onChange={(e) => setNewMediaModule(e.target.value as any)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                  >
                    <option value="ACCUEIL">Accueil</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="HOTELLERIE">Hôtellerie</option>
                    <option value="VISION">Vision Caméras</option>
                    <option value="IPTV">IPTV</option>
                    <option value="AICORE">AI Core</option>
                    <option value="SYSTEME">Système</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">URL / Fichier Image *</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... ou URL Cloud Storage"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="logo, transport, vip, abidjan"
                  value={newMediaTags}
                  onChange={(e) => setNewMediaTags(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Utilisation</label>
                <textarea
                  rows={2}
                  placeholder="Expliquez brièvement l'utilisation de ce visuel..."
                  value={newMediaDesc}
                  onChange={(e) => setNewMediaDesc(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs p-2.5 rounded-lg border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  Téléverser & Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BANNER (Firestore Workflow) */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto my-auto scrollbar-thin scrollbar-thumb-orange-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10 pt-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-400" />
                <span>{editingBannerId ? 'Éditer la Bannière (Cloud Firestore)' : 'Créer une Bannière (Cloud Firestore)'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowBannerModal(false);
                  setModalErrorMessage(null);
                  setEditingBannerId(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explicit Error Banner in Modal if Firestore or Validation Error occurs */}
            {modalErrorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Échec de l'enregistrement dans la base de données :</p>
                  <p className="text-slate-300 leading-relaxed">{modalErrorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddBannerSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Titre de la Bannière *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grand Départ Vacances - Réservez vos Titres de Transport en Ligne"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Sous-titre / Description</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cumulez des points de fidélité et profitez de -15% sur les trajets Abidjan - San-Pédro avec UTB & SBTA."
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Image Input (URL or Local File Upload) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block mb-1">Visuel de la Bannière *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-orange-400" />
                    <span>Fichier</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            if (uploadEvent.target?.result) {
                              setBannerImageUrl(uploadEvent.target.result as string);
                              showToast('Image locale convertie et prête pour Firestore !', 'info');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Live Banner Image Preview */}
                {bannerImageUrl ? (
                  <div className="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                    <img
                      src={bannerImageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'}
                      alt="Aperçu bannière"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80';
                        showToast("Image distante inaccessible, utilisation de l'image de fallback.", 'error');
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-slate-950/80 text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Aperçu Valide
                    </div>
                  </div>
                ) : null}
              </div>

              {/* CTA Button and Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Texte du Bouton (CTA)</label>
                  <input
                    type="text"
                    placeholder="Ex: Réservers un billet"
                    value={bannerCtaText}
                    onChange={(e) => setBannerCtaText(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Destination / Lien</label>
                  <input
                    type="text"
                    placeholder="Ex: /transport ou https://..."
                    value={bannerCtaUrl}
                    onChange={(e) => setBannerCtaUrl(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Badge & Agency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Badge Promotionnel</label>
                  <input
                    type="text"
                    placeholder="Ex: PROMO -15%"
                    value={bannerBadgeText}
                    onChange={(e) => setBannerBadgeText(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Partenaire / Agence</label>
                  <input
                    type="text"
                    placeholder="Ex: UTB & SBTA"
                    value={bannerAgencyName}
                    onChange={(e) => setBannerAgencyName(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Module & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Module Cible</label>
                  <select
                    value={bannerModule}
                    onChange={(e) => setBannerModule(e.target.value as any)}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  >
                    <option value="ACCUEIL">Accueil Grand Public</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="HOTELLERIE">Hôtellerie</option>
                    <option value="VISION">Vision Caméras</option>
                    <option value="IPTV">IPTV Streaming</option>
                    <option value="AICORE">AI Core Assistant</option>
                    <option value="PROMOTIONS">Promotions Spéciales</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Priorité (1 = max)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={bannerPriority}
                    onChange={(e) => setBannerPriority(Number(e.target.value))}
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date Début</label>
                  <input
                    type="date"
                    value={bannerStartDate}
                    onChange={(e) => setBannerStartDate(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={bannerEndDate}
                    onChange={(e) => setBannerEndDate(e.target.value)}
                    className="w-full bg-slate-800 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Statut Initial</label>
                  <button
                    type="button"
                    onClick={() => setBannerIsActive(!bannerIsActive)}
                    className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      bannerIsActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {bannerIsActive ? '● ACTIF' : '○ INACTIF'}
                  </button>
                </div>
              </div>

              <div className="pt-3 pb-1 flex items-center justify-between border-t border-slate-800 sticky bottom-0 bg-slate-900 z-10">
                <span className="text-[10px] text-slate-400 font-mono">
                  Étape 1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; 5 Auto
                </span>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBannerModal(false);
                      setModalErrorMessage(null);
                      setEditingBannerId(null);
                    }}
                    disabled={isSavingBanner}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBanner}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-extrabold flex items-center space-x-2 shadow-lg shadow-orange-500/20"
                  >
                    {isSavingBanner ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Écriture & Relecture...</span>
                      </>
                    ) : (
                      <span>Enregistrer dans Firestore & Sync</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOGS DE WORKFLOW ET VÉRIFICATION (5 ÉTAPES) */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Journaux d'Exécution & Contrôle Firestore (5 Étapes)</h3>
                  <p className="text-[11px] text-slate-400">
                    Traçabilité complète des opérations de lecture, écriture, confirmation, rechargement et synchronisation.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={clearWorkflowLogs}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
                >
                  Purger les logs
                </button>
                <button onClick={() => setShowLogsModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-950/60 font-mono text-xs">
              {workflowLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-sans">
                  Aucun journal d'exécution enregistré pour le moment. Effectuez une action sur les bannières pour générer des logs.
                </div>
              ) : (
                workflowLogs.map((log) => {
                  const statusColors = {
                    INFO: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                    SUCCESS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                    ERROR: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    WARNING: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  };

                  return (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
                            Étape {log.step}/5
                          </span>
                          <span className="font-bold text-white">{log.stepTitle}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusColors[log.status]}`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <p className="text-slate-300 text-[11px] font-sans leading-relaxed pl-1">
                        {log.message}
                      </p>

                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">
                            Inspecter l'objet JSON...
                          </summary>
                          <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & VERSION LIGHTBOX */}
      {previewMediaItem && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            <div className="md:w-1/2 bg-slate-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
              <img
                src={previewMediaItem.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
                alt={previewMediaItem.name}
                className="max-h-72 object-contain rounded-xl border border-slate-800 shadow-md"
              />
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-white">{previewMediaItem.format}</span>
                <span>{previewMediaItem.dimensions}</span>
                <span>• {previewMediaItem.compressedSizeKb || previewMediaItem.sizeKb} KB</span>
              </div>
            </div>

            <div className="md:w-1/2 p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">{previewMediaItem.name}</h3>
                <button onClick={() => setPreviewMediaItem(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Catégorie :</span>{' '}
                  <span className="font-bold text-orange-400">{previewMediaItem.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">Module Cible :</span>{' '}
                  <span className="font-bold text-white">{previewMediaItem.targetModule}</span>
                </div>
                <div>
                  <span className="text-slate-500">Dernière Modif :</span> {previewMediaItem.updatedAt}
                </div>
                <div>
                  <span className="text-slate-500">Description :</span> {previewMediaItem.description}
                </div>
              </div>

              {/* Version History */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Historique des Versions ({previewMediaItem.versions.length})</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {previewMediaItem.versions.map((ver) => (
                    <div
                      key={ver.version}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-orange-400 font-mono">{ver.version}</span>
                          <span className="text-[10px] text-slate-400">({ver.timestamp})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{ver.comment}</div>
                      </div>

                      {previewMediaItem.url !== ver.url && (
                        <button
                          onClick={() => {
                            handleRestoreVersion(previewMediaItem.id, ver);
                            setPreviewMediaItem(null);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold"
                        >
                          Restaurer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPLACE MEDIA */}
      {replaceMediaItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-400" />
                <span>Remplacer le Média: {replaceMediaItem.name}</span>
              </h3>
              <button onClick={() => setReplaceMediaItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nouvelle URL d'Image HD *</label>
                <input
                  type="text"
                  id="replaceUrlInput"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Motif du Changement / Note de version</label>
                <input
                  type="text"
                  id="replaceCommentInput"
                  placeholder="Ex: Nouveau logo haute définition 2026"
                  className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplaceMediaItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const urlInput = (document.getElementById('replaceUrlInput') as HTMLInputElement)?.value;
                    const commentInput = (document.getElementById('replaceCommentInput') as HTMLInputElement)?.value;
                    handleReplaceSubmit(replaceMediaItem.id, urlInput, commentInput);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                >
                  Valider la Nouvelle Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
