import React, { useState } from 'react';
import { AccommodationType } from '../../types';
import { CreateHotelParams } from '../../core/ports/hotel.ports';
import { Building2, X, CheckCircle2, ShieldCheck, UserCheck, Sparkles, MapPin, Phone, Mail, DollarSign, Bed, AlertCircle } from 'lucide-react';

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateHotelParams) => Promise<void>;
  currentRole: 'SUPER_ADMIN' | 'ADMIN_HOTEL';
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentRole
}) => {
  if (!isOpen) return null;

  // Hotel details state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccommodationType>('Hôtel');
  const [stars, setStars] = useState<number>(4);
  const [region, setRegion] = useState('Lagunes');
  const [city, setCity] = useState('Abidjan');
  const [commune, setCommune] = useState('Cocody');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState<number>(45000);
  const [imageUrl, setImageUrl] = useState('');

  // Admin Account details state
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ hotelName: string; adminEmail: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Veuillez saisir le nom de l'établissement.");
      return;
    }
    if (!city.trim() || !address.trim()) {
      setErrorMessage("La ville et l'adresse sont obligatoires.");
      return;
    }
    if (!adminFullName.trim() || !adminEmail.trim()) {
      setErrorMessage("Veuillez renseigner le nom et l'email de l'administrateur de l'hôtel.");
      return;
    }

    setIsSubmitting(true);

    try {
      const params: CreateHotelParams = {
        name: name.trim(),
        type,
        stars,
        region,
        city: city.trim(),
        commune: commune.trim(),
        address: address.trim(),
        phone: phone.trim() || '+225 07 00 00 00 00',
        email: email.trim() || adminEmail.trim(),
        description: description.trim(),
        pricePerNight,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
        adminFullName: adminFullName.trim(),
        adminEmail: adminEmail.trim(),
        adminPhone: adminPhone.trim() || phone.trim() || '+225 07 00 00 00 00',
        createdById: 'admin-current',
        createdByRole: currentRole
      };

      await onSubmit(params);

      setSuccessResult({
        hotelName: name,
        adminEmail: adminEmail
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de la création transactionnelle de l'hôtel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center space-x-2">
                <span>Créer un Établissement Hôtelier</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Workflow Transactionnel
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Création automatisée de l'hôtel, du compte Admin Hôtel et des paramètres initiaux.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="font-bold">Erreur de transaction :</strong> {errorMessage}
            </div>
          </div>
        )}

        {successResult ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">
                Établissement & Compte Admin Créés !
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                L'établissement <strong className="text-emerald-400">{successResult.hotelName}</strong> a été initialisé avec succès et activé sur la plateforme nationale.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Rôle attribué :</span>
                <span className="font-bold text-emerald-400">ADMIN_HOTEL</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Identifiant Connexion :</span>
                <span className="font-mono text-white">{successResult.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Mot de Passe Provisoire :</span>
                <span className="font-mono text-emerald-400 font-bold">Password123!</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Chambres initialisées :</span>
                <span className="font-bold text-blue-400">2 Chambres (Deluxe + Suite)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              Terminer & Revenir à la liste
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Section 1: Informations Établissement */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>1. Informations Générales de l'Établissement</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Nom de l'établissement *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hôtel Sofitel Abidjan Ivoire"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Type d'hébergement *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccommodationType)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Hôtel">Hôtel</option>
                    <option value="Résidence Meublée">Résidence Meublée</option>
                    <option value="Maison d'Hôtes">Maison d'Hôtes</option>
                    <option value="Appartement">Appartement</option>
                    <option value="Complexe Touristique">Complexe Touristique</option>
                    <option value="Auberge">Auberge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Classement Étoiles (1 à 5)</label>
                  <select
                    value={stars}
                    onChange={(e) => setStars(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={5}>5 Étoiles ★★★★★</option>
                    <option value={4}>4 Étoiles ★★★★</option>
                    <option value={3}>3 Étoiles ★★★</option>
                    <option value={2}>2 Étoiles ★★</option>
                    <option value={1}>1 Étoile ★</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Région *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Lagunes, San-Pédro, Gbêkê"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Abidjan, Yamoussoukro, San-Pédro"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Commune / Quartier</label>
                  <input
                    type="text"
                    placeholder="Ex: Cocody, Marcory Zone 4"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tarif de base par nuitée (FCFA) *</label>
                  <input
                    type="number"
                    min={5000}
                    step={5000}
                    required
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-bold text-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Adresse complète *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Boulevard Hassan II, Cocody, Abidjan"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Téléphone Réception</label>
                  <input
                    type="text"
                    placeholder="Ex: +225 27 22 48 26 26"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Email Réception / Réservations</label>
                  <input
                    type="email"
                    placeholder="Ex: reservation@sofitel-abidjan.ci"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">URL Photo Principale (Façade / Vue)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-1566073771259-6a8506099945..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Compte Administrateur Hôtel */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span>2. Compte Administrateur Hôtel (RBAC)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Nom complet de l'Administrateur *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: M. Jean-Philippe Kouassi"
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Email Administrateur (Identifiant) *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: admin.hotel@sofitel-abidjan.ci"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Téléphone Direct Admin</label>
                  <input
                    type="text"
                    placeholder="Ex: +225 07 08 09 10 11"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Création Transactionnelle...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Valider & Créer l'Établissement</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
