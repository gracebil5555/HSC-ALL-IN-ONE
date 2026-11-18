"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import {
  membersService,
  DEFAULT_ECCLESIAL_FUNCTIONS,
  DEFAULT_MEMBER_STATUSES,
} from "@/services/members.service";
import { departmentsService, DepartmentItem } from "@/services/departments.service";
import { PageHeader } from "@/components/layout/PageHeader";
import { ComponentCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { ArrowLeft, Save, Lock } from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const { campuses, currentCampusId, currentUser } = useTenant();
  const { isSuperSuperAdmin } = useRole();

  const defaultCampusId =
    currentCampusId !== "all" && currentCampusId
      ? String(currentCampusId)
      : String(currentUser?.campus_id || campuses[0]?.id || "1");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [residentialArea, setResidentialArea] = useState("");
  const [campusId, setCampusId] = useState(defaultCampusId);
  const [ecclesialFunction, setEcclesialFunction] = useState("MEMBRE");
  const [status, setStatus] = useState("NOUVEAU");
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [brigadeId, setBrigadeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [stage, setStage] = useState<any>("ACCUEIL");
  const [isBaptized, setIsBaptized] = useState(false);
  const [baptismDate, setBaptismDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [brigadesList, setBrigadesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [ecclesialFunctions, setEcclesialFunctions] = useState(DEFAULT_ECCLESIAL_FUNCTIONS);
  const [memberStatuses, setMemberStatuses] = useState(DEFAULT_MEMBER_STATUSES);

  useEffect(() => {
    if (!isSuperSuperAdmin && currentUser?.campus_id) {
      setCampusId(String(currentUser.campus_id));
    } else if (currentCampusId !== "all" && currentCampusId) {
      setCampusId(String(currentCampusId));
    } else if (campuses.length > 0 && !campusId) {
      setCampusId(String(campuses[0].id));
    }
  }, [currentUser, currentCampusId, campuses, isSuperSuperAdmin]);

  useEffect(() => {
    membersService.getEcclesialFunctions().then((items) => {
      if (items.length > 0) {
        setEcclesialFunctions(items.map((i) => ({ code: i.code, label: i.label })));
      }
    });
    membersService.getMemberStatuses().then((items) => {
      if (items.length > 0) {
        setMemberStatuses(items.map((i) => ({ code: i.code, label: i.label, color: i.color })));
      }
    });
  }, []);

  useEffect(() => {
    if (!campusId) return;
    membersService.getBrigades(campusId).then(setBrigadesList);
    departmentsService.getDepartments(campusId).then(setDepartmentsList);
  }, [campusId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const lockedCampusId = !isSuperSuperAdmin && currentUser?.campus_id
      ? String(currentUser.campus_id)
      : campusId;

    await membersService.createMember({
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp: whatsapp || phone,
      residential_area: residentialArea,
      campus_id: lockedCampusId,
      status,
      ecclesial_function: ecclesialFunction,
      sms_opt_in: smsOptIn,
      whatsapp_opt_in: whatsappOptIn,
      brigade_id: brigadeId ? brigadeId : null,
      department_id: departmentId || null,
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

        <ComponentCard title="Rattachement Ecclésial & Structure (Sections 8, 16 & 25)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campus" required>
                Église / Campus de rattachement
              </Label>
              <Select
                id="campus"
                value={campusId}
                disabled={!isSuperSuperAdmin}
                onChange={(e) => setCampusId(e.target.value)}
              >
                {(Array.isArray(campuses) ? campuses : []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </Select>
              {!isSuperSuperAdmin && (
                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Verrouillé sur le périmètre de votre Église
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="ecclesialFunction" required>
                Fonction / Position Ecclésiale (Section 25)
              </Label>
              <Select
                id="ecclesialFunction"
                value={ecclesialFunction}
                onChange={(e) => setEcclesialFunction(e.target.value)}
              >
                {(Array.isArray(ecclesialFunctions) ? ecclesialFunctions : []).map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="memberStatus" required>
                Statut du Membre
              </Label>
              <Select
                id="memberStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {(Array.isArray(memberStatuses) ? memberStatuses : []).map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-white block">
                    Consentement SMS (Opt-in)
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Autorise les messages de bienvenue et rappels par SMS
                  </span>
                </div>
                <Toggle checked={smsOptIn} onChange={setSmsOptIn} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
                <div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-white block">
                    Consentement WhatsApp (Opt-in)
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Autorise les messages de bienvenue et infos par WhatsApp
                  </span>
                </div>
                <Toggle checked={whatsappOptIn} onChange={setWhatsappOptIn} />
              </div>
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
                {(Array.isArray(brigadesList) ? brigadesList : []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="department">Département de Service (Dynamique)</Label>
              <Select
                id="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">Aucun département pour l'instant</option>
                {(Array.isArray(departmentsList) ? departmentsList : []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
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
          <Button type="submit" variant="default" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Enregistrer le fidèle
          </Button>
        </div>
      </form>
    </div>
  );
}
