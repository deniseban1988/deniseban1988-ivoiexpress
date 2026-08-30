import React, { useState, useEffect } from 'react';
import { useHexagonalArchitecture } from '../../core/context/HexagonalArchitectureContext';
import { UserAccount, UserRole, TransportAgency, Hotel, ExtendedRole } from '../../types';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Unlock,
  Building2,
  Bus,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ShieldAlert,
  Layers,
  History,
  Check,
  Sliders
} from 'lucide-react';

interface UserManagementModuleProps {
  agencies: TransportAgency[];
  hotels: Hotel[];
  currentRole: UserRole;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  agencies,
  hotels,
  currentRole
}) => {
  const { authUseCases, auditLoggerAdapter } = useHexagonalArchitecture();

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // New Account Modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [targetRole, setTargetRole] = useState<'ADMIN_AGENCE' | 'ADMIN_HOTEL'>('ADMIN_AGENCE');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(agencies[0]?.id || '');
  const [selectedHotelId, setSelectedHotelId] = useState<string>(hotels[0]?.id || '');

  // Status & Feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Extensible roles panel toggle
  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT' | 'EXTENSIBLE_ROLES'>('USERS');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadUsers = async () => {
    try {
      const list = await authUseCases.getUsersList(currentRole);
      setUsers(list);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const loadAuditLogs = async () => {
    const logs = await auditLoggerAdapter.getLogs('Sécurité');
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
  }, [currentRole]);

  const handleToggleLock = async (userId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await authUseCases.toggleUserLockState(currentRole, userId);
      setActionSuccess(`Statut du compte ${updated.email} mis à jour : ${updated.isLocked ? 'Verrouillé' : 'Actif'}`);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      let agencyName: string | undefined = undefined;
      let hotelName: string | undefined = undefined;

      if (targetRole === 'ADMIN_AGENCE') {
        const ag = agencies.find(a => a.id === selectedAgencyId);
        agencyName = ag?.name;
      } else if (targetRole === 'ADMIN_HOTEL') {
        const ht = hotels.find(h => h.id === selectedHotelId);
        hotelName = ht?.name;
      }

      const created = await authUseCases.createUserAccountByAdmin(currentRole, {
        fullName,
        email,
        phone,
        role: targetRole,
        status: 'Actif',
        agencyId: targetRole === 'ADMIN_AGENCE' ? selectedAgencyId : undefined,
        agencyName,
        hotelId: targetRole === 'ADMIN_HOTEL' ? selectedHotelId : undefined,
        hotelName,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
      });

      setActionSuccess(`Compte ${created.role} créé avec succès pour ${created.fullName} (${created.email})`);
      setShowCreateModal(false);
      setFullName('');
      setEmail('');
      setPhone('');
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
              Sécurité RBAC Centralisée
            </span>
            <span className="text-xs text-slate-400 font-bold">• Super Admin Console</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Gestion des Utilisateurs & Contrôle des Accès
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Créez les comptes Administrateurs d'Agences et d'Hôtels, supervisez le verrouillage de sécurité et consultez l'historique d'audit des connexions.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg hover:brightness-110 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un Compte Admin</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'USERS'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Comptes Utilisateurs ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'AUDIT'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Journal d'Audit Sécurité</span>
        </button>

        <button
          onClick={() => setActiveTab('EXTENSIBLE_ROLES')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'EXTENSIBLE_ROLES'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Architecture des Rôles (Évolutivité)</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white text-xs font-bold">OK</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white text-xs font-bold">Fermer</button>
        </div>
      )}

      {/* TAB 1: USERS LIST */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-9 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 px-3 py-2 focus:outline-none"
              >
                <option value="ALL">Tous les Rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN_AGENCE">Admin Agence</option>
                <option value="ADMIN_HOTEL">Admin Hôtel</option>
                <option value="VOYAGEUR">Voyageur</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Utilisateur</th>
                    <th className="p-4">Rôle</th>
                    <th className="p-4">Entité Rattachée</th>
                    <th className="p-4">Statut Secu</th>
                    <th className="p-4">Dernière Connexion</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 flex items-center space-x-3">
                        <img
                          src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=0F4C81&color=ffffff`}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=0F4C81&color=ffffff`;
                          }}
                        />
                        <div>
                          <div className="font-bold text-white">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400">{u.email} • {u.phone}</div>
                        </div>
                      </td>

                      <td className="p-4">
                        {u.role === 'SUPER_ADMIN' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                            Super Admin
                          </span>
                        )}
                        {u.role === 'ADMIN_AGENCE' && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black">
                            Admin Agence
                          </span>
                        )}
                        {u.role === 'ADMIN_HOTEL' && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-black">
                            Admin Hôtel
                          </span>
                        )}
                        {u.role === 'VOYAGEUR' && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black">
                            Voyageur
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-slate-200">
                        {u.agencyName || u.hotelName || 'Plateforme Nationale'}
                      </td>

                      <td className="p-4">
                        {u.isLocked ? (
                          <span className="inline-flex items-center space-x-1 text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 text-[10px]">
                            <Lock className="w-3 h-3" />
                            <span>Verrouillé</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                            <Check className="w-3 h-3" />
                            <span>Actif</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-400 text-[11px]">
                        {u.lastLoginAt || 'Jamais connecté'}
                      </td>

                      <td className="p-4 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleLock(u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              u.isLocked
                                ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-500/30'
                                : 'bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-500/30'
                            }`}
                          >
                            {u.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Journal d'Audit des Connexions & Authentifications
            </h3>
            <span className="text-xs text-slate-400 font-bold">{auditLogs.length} événements enregistrés</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">{log.role}</span>
                    <span className="text-[10px] text-slate-500">{log.ipAddress}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${log.status === 'Succès' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.status}
                  </div>
                  <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EXTENSIBLE ROLES ARCHITECTURE */}
      {activeTab === 'EXTENSIBLE_ROLES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Évolutivité de l'Architecture des Rôles (RBAC Flexible)
            </h3>
            <p className="text-xs text-slate-400">
              Le système permet d'ajouter ultérieurement de nouveaux rôles sans altérer les rôles existants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400">Contrôleur de Gare</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Prêt à activer</span>
              </div>
              <p className="text-xs text-slate-400">
                Permet la validation des billets sur smartphone/scanner QR code aux quais d'embarquement sans accès aux données financières d'agence.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400">Support Client IVOIReXpress</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">Prêt à activer</span>
              </div>
              <p className="text-xs text-slate-400">
                Accès en lecture seule pour assistance aux voyageurs, gestion des litiges de réservations et remboursement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN ACCOUNT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative">
            
            <div className="space-y-1 text-left">
              <h3 className="text-xl font-black text-white">Création d'un Compte Admin</h3>
              <p className="text-xs text-slate-400">Réservé exclusivement au Super Admin.</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Type de Compte</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold"
                >
                  <option value="ADMIN_AGENCE">Admin Agence de Transport</option>
                  <option value="ADMIN_HOTEL">Admin Établissement Hôtelier</option>
                </select>
              </div>

              {targetRole === 'ADMIN_AGENCE' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Rattacher à l'Agence</label>
                  <select
                    value={selectedAgencyId}
                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    {agencies.map(ag => (
                      <option key={ag.id} value={ag.id}>{ag.name} ({ag.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {targetRole === 'ADMIN_HOTEL' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Rattacher à l'Hôtel</label>
                  <select
                    value={selectedHotelId}
                    onChange={(e) => setSelectedHotelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  >
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>{h.name} - {h.city}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nom Complet du Responsable</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Kouassi Jean-Baptiste"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">E-mail Officiel</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@agence.ci"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Téléphone Direct</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-500"
                >
                  Créer et Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
