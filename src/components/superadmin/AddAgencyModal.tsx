import React, { useState } from 'react';
import { Building2, UserCheck, Mail, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, Bus, Lock } from 'lucide-react';
import { CreateAgencyParams } from '../../core/ports/transport.ports';
import { UserRole } from '../../types';

interface AddAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: CreateAgencyParams) => Promise<void> | void;
  currentRole: UserRole;
}

export const AddAgencyModal: React.FC<AddAgencyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentRole
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: 'Lagunes',
    city: 'Abidjan',
    commune: 'Adjamé',
    address: 'Gare Routière Principale VIP',
    phone: '+225 07 00 00 11 22',
    email: 'contact@agence.ci',
    description: 'Compagnie de transport interurbain haute sécurité',
    logoUrl: '',
    adminFullName: '',
    adminEmail: '',
    adminPhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    agencyName: string;
    adminName: string;
    adminEmail: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict Client Validations
    if (!formData.name.trim()) {
      setError("Le nom de l'agence de transport est obligatoire.");
      return;
    }
    if (!formData.code.trim()) {
      setError("Le code unique de l'agence est obligatoire.");
      return;
    }
    if (!formData.adminFullName.trim()) {
      setError("Le nom et prénom de l'administrateur sont obligatoires.");
      return;
    }
    if (!formData.adminEmail.trim()) {
      setError("L'adresse email de l'administrateur est obligatoire.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        region: formData.region,
        city: formData.city,
        address: `${formData.commune}, ${formData.address}`,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        logoUrl: formData.logoUrl,
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPhone: formData.adminPhone || formData.phone,
        createdById: 'superadmin-master',
        createdByRole: currentRole
      });

      setSuccessData({
        agencyName: formData.name.trim(),
        adminName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim()
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'agence.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-left">
        {/* Close Button */}
        <button
          onClick={successData ? handleCloseSuccess : onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Transaction Atomique Réussie
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                Agence & Administrateur Créés
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                L'agence <strong className="text-emerald-400">{successData.agencyName}</strong> est immédiatement opérationnelle.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>Rôle attribué :</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  ADMIN_AGENCE
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>Administrateur responsable :</span>
                <span className="text-white font-bold">{successData.adminName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>Identifiant d'accès :</span>
                <span className="text-blue-400 font-bold">{successData.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Mot de passe temporaire :</span>
                <span className="text-amber-400 font-bold">Password123!</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-300 flex items-start space-x-3 text-left">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <strong>Invitation sécurisée envoyée :</strong> Un e-mail d'activation avec jeton à durée limitée a été transmis à <span className="text-white font-semibold">{successData.adminEmail}</span> pour lui permettre de définir son mot de passe et de configurer la gare routière.
              </p>
            </div>

            <button
              onClick={handleCloseSuccess}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Fermer et Retourner au Tableau de Bord
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-1">
                <Bus className="w-3.5 h-3.5" />
                <span>Création Automatisée Agence & Admin • Transaction RBAC</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Ajouter une Agence de Transport
              </h2>
              <p className="text-xs text-slate-400">
                Chaque agence est obligatoirement rattachée à un compte Admin Agence dès sa création dans une transaction unique.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* SECTION 1: ÉTABLISSEMENT */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                  <Building2 className="w-4 h-4" />
                  <span>1. Informations Générales de la Compagnie</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom de la Compagnie *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="Ex: UTB Express VIP"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Code Unique (2-5 lettres) *
                    </label>
                    <input
                      type="text"
                      name="code"
                      required
                      placeholder="Ex: UTB"
                      value={formData.code}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none uppercase transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Région Siège
                    </label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ville Siège
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Commune
                    </label>
                    <input
                      type="text"
                      name="commune"
                      value={formData.commune}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Téléphone Support / Gare
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Officiel Agence
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: ADMINISTRATEUR ASSOCIÉ (OBLIGATOIRE) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-blue-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4" />
                    <span>2. Compte Administrateur Agence Associé (Inclus)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono text-[10px]">
                    Rôle : ADMIN_AGENCE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nom & Prénom de l'Admin *
                    </label>
                    <input
                      type="text"
                      name="adminFullName"
                      required
                      placeholder="Ex: Konan Koffi Jean-Baptiste"
                      value={formData.adminFullName}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Professionnel (Identifiant) *
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      required
                      placeholder="Ex: admin.konan@utb.ci"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Direct Admin (Double Authentification / SMS)
                  </label>
                  <input
                    type="text"
                    name="adminPhone"
                    placeholder="Ex: +225 07 88 99 00 11"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* TRANSACTION WORKFLOW NOTIFICATION */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Séquence Transactionnelle Automatisée (Atomicidad IVOIReXpress)</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>Création de la compagnie de transport & paramètres réseau</li>
                  <li>Instanciation du compte Admin Agence & attribution du rôle RBAC</li>
                  <li>Rattachement multi-tenant exclusif (Isolation de la gare)</li>
                  <li>Initialisation des modules Transport, Vision et IPTV de l'agence</li>
                  <li>Envoi de l'invitation d'activation sécurisée par e-mail</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Création Transactionnelle...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Valider & Créer l'Agence</span>
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
