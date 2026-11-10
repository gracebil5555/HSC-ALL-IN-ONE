"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import {
  UserCheck,
  Shield,
  UserPlus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldAlert,
  Building2,
  Lock,
  Edit,
  Trash2,
  Layers,
  Crown,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { usersService } from "@/services/users.service";
import { CurrentUser, UserRole, EcclesialFunction, GRANULAR_PERMISSIONS } from "@/types/auth.types";

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: "SUPER_SUPER_ADMIN", label: "Super Super Admin", desc: "Supervision globale de tout le réseau HSC" },
  { value: "SUPER_ADMIN", label: "Super Admin", desc: "Dirigeant d'une Église mère ou d'une extension" },
  { value: "ADMIN_DEPT", label: "Admin Département", desc: "Responsable titulaire d'une structure interne" },
  { value: "ADJOINT", label: "Adjoint (Délégué)", desc: "Adjoint recevant des permissions spécifiques" },
  { value: "MEMBRE", label: "Membre / Ouvrier", desc: "Fidèle membre actif de l'église" },
];

const ECCLESIAL_FUNCTIONS: { value: EcclesialFunction; label: string }[] = [
  { value: "APOTRE", label: "Apôtre" },
  { value: "PASTEUR", label: "Pasteur" },
  { value: "ANCIEN", label: "Ancien" },
  { value: "DIACRE", label: "Diacre" },
  { value: "EVANGELISTE", label: "Évangéliste" },
  { value: "DOCTEUR", label: "Docteur" },
  { value: "PROPHETE", label: "Prophète" },
  { value: "BERGER", label: "Berger" },
  { value: "RESPONSABLE", label: "Responsable de Département" },
  { value: "ADJOINT_DEPT", label: "Adjoint de Département" },
  { value: "OUVRIER", label: "Ouvrier" },
  { value: "FIDELE", label: "Fidèle" },
];

export default function UsersManagementPage() {
  const { currentCampusId, currentCampus, campuses } = useTenant();
  const { isSuperSuperAdmin, isSuperAdmin } = useRole();

  // Hiérarchie MVC / RBAC stricte :
  // - Seul le Super Super Admin peut nommer un Super Admin (Pasteur d'extension / église)
  // - Le Super Admin peut créer des Admin Dept, Adjoints et Membres dans son église
  const availableRoles = ROLE_OPTIONS.filter((r) => {
    if (r.value === "SUPER_SUPER_ADMIN") return false; // Titre unique mondial
    if (r.value === "SUPER_ADMIN") return isSuperSuperAdmin; // Seul le Visionnaire nomme des Super Admins
    return true; // ADMIN_DEPT, ADJOINT, MEMBRE
  });

  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [functionFilter, setFunctionFilter] = useState<string>("ALL");

  // Modal Création Utilisateur
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    title: "",
    role: "MEMBRE" as UserRole,
    ecclesial_function: "FIDELE" as EcclesialFunction,
    campus: currentCampusId !== "all" ? Number(currentCampusId) : 1,
    password: "",
  });

  // Modal Assignation Adjoint (Section 7 & 15)
  const [isDeputyModalOpen, setIsDeputyModalOpen] = useState(false);
  const [selectedTitulaire, setSelectedTitulaire] = useState<CurrentUser | null>(null);
  const [selectedDeputyId, setSelectedDeputyId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["voir", "creer"]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersService.getUsers(currentCampusId, roleFilter);
      setUsers(data);
    } catch (err) {
      console.error("Erreur lors du chargement des comptes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentCampusId, roleFilter]);

  // Filtrage local
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q));

    const matchesFunction = functionFilter === "ALL" || u.ecclesial_function === functionFilter;

    return matchesSearch && matchesFunction;
  });

  // Création utilisateur
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.first_name || !createForm.last_name || !createForm.username) return;

    setIsSubmitting(true);
    try {
      await usersService.createUser({
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        username: createForm.username,
        email: createForm.email,
        phone: createForm.phone,
        title: createForm.title,
        role: createForm.role,
        ecclesial_function: createForm.ecclesial_function,
        campus: createForm.campus,
        password: createForm.password || "HSC@2026",
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        title: "",
        role: "MEMBRE",
        ecclesial_function: "FIDELE",
        campus: currentCampusId !== "all" ? Number(currentCampusId) : 1,
        password: "",
      });
      await loadUsers();
    } catch (error) {
      alert("Erreur lors de la création de l'utilisateur. Vérifiez les champs saisis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assignation Adjoint
  const handleAssignDeputy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTitulaire || !selectedDeputyId) return;

    setIsSubmitting(true);
    try {
      await usersService.assignDeputy(selectedTitulaire.id, {
        deputy_id: selectedDeputyId,
        delegated_permissions: selectedPermissions,
      });

      setIsDeputyModalOpen(false);
      setSelectedTitulaire(null);
      setSelectedDeputyId("");
      setSelectedPermissions(["voir", "creer"]);
      await loadUsers();
    } catch (error) {
      alert("Erreur lors de l'assignation de l'adjoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Révocation Adjoint
  const handleRevokeDeputy = async (deputyId: string) => {
    if (!confirm("Voulez-vous vraiment révoquer la délégation de cet adjoint ?")) return;
    try {
      await usersService.revokeDeputy(deputyId);
      await loadUsers();
    } catch (error) {
      alert("Erreur lors de la révocation.");
    }
  };

  // Suppression
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Confirmez-vous la suppression du compte de ${name} ?`)) return;
    try {
      await usersService.deleteUser(id);
      await loadUsers();
    } catch (error) {
      alert("Impossible de supprimer cet utilisateur.");
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "SUPER_SUPER_ADMIN":
        return <Badge color="primary"><Crown className="w-3 h-3 mr-1" /> Super Super Admin</Badge>;
      case "SUPER_ADMIN":
        return <Badge color="info"><Shield className="w-3 h-3 mr-1" /> Super Admin</Badge>;
      case "ADMIN_DEPT":
        return <Badge color="warning"><Layers className="w-3 h-3 mr-1" /> Admin Dept</Badge>;
      case "ADJOINT":
        return <Badge color="success"><UserCheck className="w-3 h-3 mr-1" /> Adjoint</Badge>;
      default:
        return <Badge color="light">Membre</Badge>;
    }
  };

  const getEcclesialBadge = (func: string) => {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        {func || "Fidèle"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portail des Comptes & Gouvernance"
        description="Gestion hiérarchique des utilisateurs, des rôles techniques RBAC et du système de délégation d'adjoints."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const titulaire = users.find((u) => u.role === "SUPER_ADMIN" || u.role === "SUPER_SUPER_ADMIN") || users[0];
                setSelectedTitulaire(titulaire);
                setIsDeputyModalOpen(true);
              }}
            >
              <UserCheck className="w-4 h-4 mr-1.5 text-brand-600" />
              + Assigner un Adjoint
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              + Nouvel Utilisateur
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Comptes</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Utilisateurs enregistrés</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Super Admins</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "SUPER_SUPER_ADMIN").length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Directions d'Églises</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Adjoints Titularisés</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {users.filter((u) => u.is_deputy || u.role === "ADJOINT").length}
            </h3>
            <p className="text-[11px] text-success-600 font-medium mt-0.5">Délégations actives</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-500/15 text-success-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Admins Départements</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {users.filter((u) => u.role === "ADMIN_DEPT").length}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Responsables de structures</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <ComponentCard
        title="Répertoire des Comptes Utilisateurs"
        desc="Visualisez et administrez les droits d'accès techniques et les fonctions ecclésiales selon le modèle d'architecture HSC."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Recherche */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, rôle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:outline-hidden focus:border-brand-500"
              />
            </div>

            {/* Filtre Rôle */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            >
              <option value="ALL">Tous les Rôles Techniques</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Filtre Fonction Ecclésiale */}
            <select
              value={functionFilter}
              onChange={(e) => setFunctionFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            >
              <option value="ALL">Toutes les Fonctions Ecclésiales</option>
              {ECCLESIAL_FUNCTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <TableContainer>
          <TableHead>
            <TableHeaderCell>Utilisateur & Contact</TableHeaderCell>
            <TableHeaderCell>Rôle Technique (RBAC)</TableHeaderCell>
            <TableHeaderCell>Fonction Ecclésiale</TableHeaderCell>
            <TableHeaderCell>Église / Extension</TableHeaderCell>
            <TableHeaderCell>Système d'Adjoint & Permissions</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Chargement des comptes utilisateurs…
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucun compte correspondant aux critères
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  {/* Identité */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-100 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800 shrink-0 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 text-xs">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                        ) : (
                          `${u.first_name?.[0] || ""}${u.last_name?.[0] || ""}`
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-gray-900 dark:text-white">
                            {u.title ? `${u.title} ` : ""}
                            {u.first_name} {u.last_name}
                          </span>
                          {!u.is_active && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-100 text-red-600 font-medium">
                              Inactif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>@{u.username}</span>
                          {u.phone && (
                            <>
                              <span>•</span>
                              <span>{u.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Rôle Technique */}
                  <TableCell>{getRoleBadge(u.role)}</TableCell>

                  {/* Fonction Ecclésiale */}
                  <TableCell>
                    {getEcclesialBadge(u.ecclesial_function_display || u.ecclesial_function)}
                  </TableCell>

                  {/* Campus */}
                  <TableCell>
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {u.campus_name || (u.role === "SUPER_SUPER_ADMIN" ? "Réseau Mondial (Tous)" : "Non rattaché")}
                    </span>
                  </TableCell>

                  {/* Système d'Adjoint & Permissions */}
                  <TableCell>
                    {u.is_deputy ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-success-700 dark:text-success-400 font-medium">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Adjoint de : {u.deputy_of_name || "Titulaire"}</span>
                        </div>
                        {u.delegated_permissions && u.delegated_permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.delegated_permissions.map((p) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300 border border-success-200 dark:border-success-800"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400">Aucune permission déléguée</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Titulaire standard</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Assigner comme adjoint d'un titulaire */}
                      <button
                        onClick={() => {
                          setSelectedTitulaire(u);
                          setIsDeputyModalOpen(true);
                        }}
                        title="Désigner un adjoint pour ce responsable"
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 hover:text-brand-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>

                      {/* Révoquer si c'est un adjoint */}
                      {u.is_deputy && (
                        <button
                          onClick={() => handleRevokeDeputy(u.id)}
                          title="Révoquer la fonction d'adjoint"
                          className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-500/10 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`)}
                        title="Supprimer l'accès"
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableContainer>
      </ComponentCard>

      {/* Modal: Création d'Utilisateur */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un Nouveau Compte Utilisateur"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Prénom</Label>
              <Input
                required
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                placeholder="Ex: Chancel"
              />
            </div>
            <div>
              <Label required>Nom de famille</Label>
              <Input
                required
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                placeholder="Ex: NIATI"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Identifiant (Username)</Label>
              <Input
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="prenom.nom"
              />
            </div>
            <div>
              <Label>Titre honorifique</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Pasteur, Dr., Berger..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="nom@hsc-eglise.org"
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="+242 06..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Rôle Technique RBAC</Label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} — {r.desc}
                  </option>
                ))}
              </select>
              {isSuperSuperAdmin && (
                <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1">
                  ✓ En tant que Super Super Admin, vous pouvez désigner des Super Admins (Pasteurs responsables d'églises).
                </p>
              )}
            </div>

            <div>
              <Label required>Fonction Ecclésiale</Label>
              <select
                value={createForm.ecclesial_function}
                onChange={(e) => setCreateForm({ ...createForm, ecclesial_function: e.target.value as EcclesialFunction })}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                {ECCLESIAL_FUNCTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label required>Église / Campus de rattachement</Label>
            <select
              value={createForm.campus}
              onChange={(e) => setCreateForm({ ...createForm, campus: Number(e.target.value) })}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city}, {c.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Mot de passe initial (laisser vide pour générer par défaut)</Label>
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="Par défaut : HSC@2026"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Enregistrer l'Utilisateur
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Attribution d'Adjoint & Délégation (Section 7 & 15) */}
      <Modal
        isOpen={isDeputyModalOpen}
        onClose={() => setIsDeputyModalOpen(false)}
        title="Désigner un Adjoint & Déléguer des Permissions"
      >
        <form onSubmit={handleAssignDeputy} className="space-y-4">
          <div className="p-3 bg-brand-50/70 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-900/40 text-xs">
            <p className="font-semibold text-brand-900 dark:text-brand-300">
              Titulaire Responsable : {selectedTitulaire?.title} {selectedTitulaire?.first_name} {selectedTitulaire?.last_name}
            </p>
            <p className="text-brand-700/80 dark:text-brand-400 mt-0.5">
              Rôle : {selectedTitulaire?.role} · Église : {selectedTitulaire?.campus_name || "Global"}
            </p>
          </div>

          <div>
            <Label required>Sélectionner la personne désignée comme Adjoint</Label>
            <select
              required
              value={selectedDeputyId}
              onChange={(e) => setSelectedDeputyId(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Choisir un membre ou serviteur --</option>
              {users
                .filter((u) => u.id !== selectedTitulaire?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function} - {u.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label required>Permissions granulaires déléguées (Section 15)</Label>
            <p className="text-[11px] text-gray-400 mb-2">
              Cochez les droits conférés à l'adjoint dans le périmètre du titulaire :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GRANULAR_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-200"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, perm.key]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.key));
                        }
                      }}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-xs font-semibold capitalize">{perm.label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">{perm.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeputyModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Confirmer la Délégation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
