"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Trash2,
  Save,
  Lock,
  User as UserIcon,
  Building2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { authService } from "@/services/auth.service";
import { ComponentCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { AvatarCropModal } from "@/components/ui/AvatarCropModal";

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [cropSource, setCropSource] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.first_name || "");
    setLastName(currentUser.last_name || "");
    setTitle(currentUser.title || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phone || "");
    setAvatar(currentUser.avatar || "");
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    const reader = new FileReader();
    reader.onerror = () => setErrorMsg("Impossible de lire le fichier image.");
    reader.onload = () => {
      setCropSource(String(reader.result));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmCrop = async (croppedDataUrl: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await authService.updateProfile({ avatar: croppedDataUrl });
      setAvatar(croppedDataUrl);
      setCurrentUser(updated);
      setCropSource(null);
      setSuccessMsg("Photo de profil recadrée et enregistrée.");
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.avatar ||
          err?.message ||
          "Erreur lors de l'enregistrement de la photo."
      );
      setCropSource(null);
    }
  };

  const handleRemoveAvatar = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({ avatar: "" });
      setAvatar("");
      setCurrentUser(updated);
      setSuccessMsg("Photo de profil supprimée.");
    } catch {
      setErrorMsg("Impossible de supprimer la photo de profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        title: title.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar.trim() || "",
      });
      setCurrentUser(updated);
      setSuccessMsg("Vos informations de profil ont été enregistrées.");
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.avatar ||
        data?.email ||
        data?.detail ||
        "Impossible de mettre à jour le profil.";
      setErrorMsg(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    try {
      const updated = await authService.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("Votre mot de passe a été modifié avec succès.");
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.current_password ||
        data?.new_password ||
        data?.detail ||
        "Impossible de modifier le mot de passe.";
      setErrorMsg(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = `${currentUser?.first_name?.[0] || "H"}${
    currentUser?.last_name?.[0] || "S"
  }`.toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Mon Profil & Paramètres
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personnalisez votre photo de profil, vos coordonnées et votre mot de passe.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 px-4 py-3 text-sm text-success-700 dark:text-success-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {/* Photo & Identité */}
      <ComponentCard
        title="Photo de Profil"
        desc="Importez une photo depuis votre appareil ou renseignez une URL d'image."
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-brand-100 dark:bg-brand-500/20 border-2 border-brand-200 dark:border-brand-500/30 flex items-center justify-center shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={currentUser?.username || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="primary" size="sm">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                {currentUser?.role_display || currentUser?.role || "Utilisateur"}
              </Badge>
              {currentUser?.campus_name && (
                <Badge color="light" size="sm">
                  <Building2 className="w-3.5 h-3.5 mr-1" />
                  {currentUser.campus_name}
                </Badge>
              )}
              {currentUser?.ecclesial_function_display && (
                <Badge color="info" size="sm">
                  {currentUser.ecclesial_function_display}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-1.5" />
                Choisir une photo
              </Button>

              {avatar && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={savingProfile}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Supprimer
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Formats acceptés : JPG, PNG, WebP (redimensionnée automatiquement).
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* Informations personnelles */}
      <ComponentCard
        title="Informations Personnelles"
        desc={`Identifiant de connexion : @${currentUser?.username || "—"}`}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Jean"
                startIcon={<UserIcon className="w-4 h-4" />}
              />
            </div>
            <div>
              <Label>Nom</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Mbemba"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Titre / Fonction affichée</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Pasteur, Trésorier, Secrétaire..."
              />
            </div>
            <div>
              <Label>Téléphone / WhatsApp</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+242 06 000 0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Adresse Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@eglise-hsc.org"
              />
            </div>
            <div>
              <Label>Ou URL directe de l&apos;avatar (optionnel)</Label>
              <Input
                value={avatar.startsWith("data:") ? "" : avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" isLoading={savingProfile}>
              <Save className="w-4 h-4 mr-1.5" />
              Enregistrer mes informations
            </Button>
          </div>
        </form>
      </ComponentCard>

      {/* Sécurité / Mot de passe */}
      <ComponentCard
        title="Sécurité du Compte"
        desc="Modifiez votre mot de passe de connexion."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label required>Mot de passe actuel</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              startIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label required>Nouveau mot de passe</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Confirmer le nouveau mot de passe</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="outline" isLoading={savingPassword}>
              <Lock className="w-4 h-4 mr-1.5" />
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </ComponentCard>

      <AvatarCropModal
        isOpen={Boolean(cropSource)}
        imageSrc={cropSource}
        onClose={() => setCropSource(null)}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}
