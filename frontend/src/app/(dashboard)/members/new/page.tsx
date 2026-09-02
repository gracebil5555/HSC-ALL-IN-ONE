"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { membersService } from "@/services/members.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComponentCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { ArrowLeft, Check, Save } from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const { campuses, currentCampusId } = useTenant();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [residentialArea, setResidentialArea] = useState("");
  const [campusId, setCampusId] = useState(
    currentCampusId === "all" ? "campus-mpita-hq" : currentCampusId
  );
  const [brigadeId, setBrigadeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [stage, setStage] = useState<any>("ACCUEIL");
  const [isBaptized, setIsBaptized] = useState(false);
  const [baptismDate, setBaptismDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await membersService.createMember({
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp: whatsapp || phone,
      residential_area: residentialArea,
      campus_id: campusId,
      brigade_id: brigadeId ? brigadeId : null,
      brigade_name:
        brigadeId === "brg-01"
          ? "Brigade David (Adultes)"
          : brigadeId === "brg-02"
          ? "GDC Jeunesse Samuel"
          : undefined,
      department_id: departmentId || null,
      department_name:
        departmentId === "dpt-01"
          ? "Chantres & Louange"
          : departmentId === "dpt-02"
          ? "Médias & Sono"
          : undefined,
      assimilation_stage: stage,
      assimilation_progress: stage === "ACCUEIL" ? "0/4" : "1/4",
      is_baptized: isBaptized,
      baptism_date: isBaptized ? baptismDate || "2026-09-01" : null,
      notes,
    });

    setIsSaving(false);
    router.push("/members");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Enregistrer un Nouveau Fidèle"
        description="Fiche d'intégration dans le registre ecclésial du campus"
        breadcrumbs={[
          { label: "Membres", href: "/members" },
          { label: "Nouveau Membre" },
        ]}
        action={
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour à l'annuaire
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <ComponentCard title="Identité & Coordonnées Personnelles">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" required>
                Prénom
              </Label>
              <Input
                id="firstName"
                placeholder="Ex: Christian"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" required>
                Nom de famille
              </Label>
              <Input
                id="lastName"
                placeholder="Ex: Mabiala"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" required>
                Téléphone principal
              </Label>
              <Input
                id="phone"
                placeholder="Ex: +242 06 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">Numéro WhatsApp (si différent)</Label>
              <Input
                id="whatsapp"
                placeholder="Ex: +242 05 000 00 00"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="residentialArea" required>
                Quartier / Adresse de résidence
              </Label>
              <Input
                id="residentialArea"
                placeholder="Ex: Mpita Total, Arrondissement 1 Lumumba"
                value={residentialArea}
                onChange={(e) => setResidentialArea(e.target.value)}
                required
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Rattachement Ecclésial & Structure">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campus" required>
                Campus de rattachement
              </Label>
              <Select
                id="campus"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="brigade">
                Brigade / GDC <span className="text-xs text-gray-400">(Optionnelle)</span>
              </Label>
              <Select
                id="brigade"
                value={brigadeId}
                onChange={(e) => setBrigadeId(e.target.value)}
              >
                <option value="">Non affecté (Optionnelle)</option>
                <option value="brg-01">Brigade David (Adultes)</option>
                <option value="brg-02">GDC Jeunesse Samuel</option>
                <option value="brg-03">Brigade Salomon (Entrepreneurs)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Département de Service</Label>
              <Select
                id="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Aucun département pour l'instant</option>
                <option value="dpt-01">Chantres & Louange</option>
                <option value="dpt-02">Médias & Sono</option>
                <option value="dpt-03">Protocole & Accueil</option>
                <option value="dpt-04">Intercession</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="stage">Étape d'Assimilation initiale</Label>
              <Select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                <option value="ACCUEIL">1. Accueil (1ère visite)</option>
                <option value="MODULE_1">2. Module 1 (Affermissement)</option>
                <option value="MODULE_2">3. Module 2 (Doctrine)</option>
                <option value="BAPTEME">4. Candidat au Baptême</option>
                <option value="INTEGRE">5. Intégré Département</option>
              </Select>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Baptême & Observations Spirituelles">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Toggle
                checked={isBaptized}
                onChange={setIsBaptized}
                label="Ce fidèle est déjà baptisé par immersion"
              />
            </div>

            {isBaptized && (
              <div className="max-w-xs">
                <Label htmlFor="baptismDate">Date du baptême</Label>
                <Input
                  id="baptismDate"
                  type="date"
                  value={baptismDate}
                  onChange={(e) => setBaptismDate(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes Pastorales / Circonstances de la 1ère visite</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Ex: Invité par sa cousine. Demande une visite pastorale à domicile..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ComponentCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/members">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer le fidèle
          </Button>
        </div>
      </form>
    </div>
  );
}
