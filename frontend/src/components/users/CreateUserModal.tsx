"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { usersService } from "@/services/users.service";
import {
  OPERATIONAL_PROFILES,
  OperationalProfile,
  UserRole,
  EcclesialFunction,
} from "@/types/auth.types";
import { CheckCircle2, Lock, ShieldCheck, Building2 } from "lucide-react";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentCampusId, campuses } = useTenant();
  const { isSuperSuperAdmin, isSuperAdmin } = useRole();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    isSuperSuperAdmin ? "PASTEUR_CAMPUS" : "GESTIONNAIRE_CAISSE"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialCampus: number =
    currentCampusId !== "all" && currentCampusId
      ? Number(currentCampusId)
      : Number(campuses[0]?.id ?? 1);

  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    title: isSuperSuperAdmin ? "Pasteur" : "Gestionnaire Caisse",
    role: (isSuperSuperAdmin ? "SUPER_ADMIN" : "ADMIN_DEPT") as UserRole,
    ecclesial_function: (isSuperSuperAdmin ? "PASTEUR" : "RESPONSABLE") as EcclesialFunction,
    campus: initialCampus,
    password: "",
  });

  const activeProfile =
    OPERATIONAL_PROFILES.find((p) => p.id === selectedProfileId) ||
    OPERATIONAL_PROFILES[0];

  const handleSelectProfile = (profile: OperationalProfile) => {
    if (profile.requiresSuperSuperAdmin && !isSuperSuperAdmin) return;
    setSelectedProfileId(profile.id);
    setCreateForm((prev) => ({
      ...prev,
      role: profile.role,
      ecclesial_function: profile.function,
      title: profile.defaultTitle,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!createForm.first_name || !createForm.last_name || !createForm.username) {
      setErrorMessage("Veuillez renseigner le prénom, le nom et l'identifiant.");
      return;
    }

    setIsSubmitting(true);
    try {
      await usersService.createUser({
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        username: createForm.username.toLowerCase().trim(),
        email: createForm.email,
        phone: createForm.phone,
        title: createForm.title,
        role: createForm.role,
        ecclesial_function: createForm.ecclesial_function,
        campus: createForm.campus,
        password: createForm.password || "HSC@2026",
      });

      alert(
        `✓ Compte "${createForm.first_name} ${createForm.last_name}" créé avec succès !\nIdentifiant : ${createForm.username}\nRôle : ${createForm.role} (${createForm.title})\nMot de passe : ${createForm.password || "HSC@2026"}`
      );

      // Reset
      setCreateForm({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        phone: "",
        title: activeProfile.defaultTitle,
        role: activeProfile.role,
        ecclesial_function: activeProfile.function,
        campus: initialCampus,
        password: "",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        "Erreur lors de la création du compte. Vérifiez que l'identifiant n'est pas déjà utilisé.";
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un Compte — Matrice des Rôles & Gouvernance HSC"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* 1. Sélection du Profil Opérationnel Officiel */}
        <div>
          <Label required>1. Profil Opérationnel & Rôle Métier (Dossier d'Architecture HSC)</Label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            Choisissez la fonction exacte du compte. Les accès aux modules (Caisse, Matériel, Vocal IA, etc.) seront automatiquement configurés.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 no-scrollbar">
            {OPERATIONAL_PROFILES.map((profile) => {
              const isSelected = selectedProfileId === profile.id;
              const isLocked = profile.requiresSuperSuperAdmin && !isSuperSuperAdmin;

              return (
                <div
                  key={profile.id}
                  onClick={() => !isLocked && handleSelectProfile(profile)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isLocked
                      ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800"
                      : isSelected
                      ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/10 ring-2 ring-brand-500/40 cursor-pointer shadow-sm"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {profile.label}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0">
                      {profile.badge}
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                    {profile.desc}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[9px] text-gray-400">
                    <span>Scope : {profile.scope}</span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{profile.support}</span>
                  </div>

                  {isLocked && (
                    <p className="mt-1.5 text-[9px] font-medium text-warning-600 dark:text-warning-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      Réservé au Super-Super Admin (Apôtre Roland G. Elenga)
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Aperçu des Fonctionnalités & Modules Liés */}
        {activeProfile && (
          <div className="p-3 bg-brand-50/50 dark:bg-brand-500/10 rounded-xl border border-brand-200 dark:border-brand-900/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Fonctionnalités & Écrans actifs pour ce compte :
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                Rôle : <strong>{activeProfile.role}</strong> ({activeProfile.function})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeProfile.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Données d'identité */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Prénom</Label>
            <Input
              required
              value={createForm.first_name}
              onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
              placeholder="Ex: Kelly"
            />
          </div>
          <div>
            <Label required>Nom de famille</Label>
            <Input
              required
              value={createForm.last_name}
              onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
              placeholder="Ex: MAKOSSO"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Identifiant de connexion</Label>
            <Input
              required
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              placeholder="prenom.nom"
            />
          </div>
          <div>
            <Label>Titre / Fonction affichée</Label>
            <Input
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="Pasteur, Berger, Gestionnaire..."
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

        {/* 4. Rattachement au Campus (Multi-Tenancy) */}
        <div>
          <Label required>Église / Campus de rattachement</Label>
          <select
            value={createForm.campus}
            disabled={!isSuperSuperAdmin} // Verrouillé sur son campus pour le Super Admin local
            onChange={(e) => setCreateForm({ ...createForm, campus: Number(e.target.value) })}
            className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 cursor-pointer"
          >
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.city}, {c.country})
              </option>
            ))}
          </select>
          {!isSuperSuperAdmin ? (
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Verrouillage étanche : Vous créez un compte affecté à votre campus d'exercice.
            </p>
          ) : (
            <p className="text-[10px] text-brand-600 dark:text-brand-400 mt-1">
              ✓ Visionnaire mondial : Vous pouvez affecter ce responsable à n'importe quelle extension.
            </p>
          )}
        </div>

        <div>
          <Label>Mot de passe initial (laisser vide pour : HSC@2026)</Label>
          <Input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Par défaut : HSC@2026"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="default" isLoading={isSubmitting}>
            Enregistrer & Activer le Compte
          </Button>
        </div>
      </form>
    </Modal>
  );
};

