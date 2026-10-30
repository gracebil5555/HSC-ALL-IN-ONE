"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { membersService } from "@/services/members.service";
import { financesService } from "@/services/finances.service";
import { Member } from "@/types/member.types";
import { CashVoucher } from "@/types/finance.types";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import {
  Users,
  Church,
  Wallet,
  ShieldAlert,
  Building2,
  Globe2,
  ArrowRight,
  PlusCircle,
  Mic,
  CheckCircle2,
  Layers,
  Lock,
  ExternalLink,
  Receipt,
  UserCheck,
  FolderPlus,
  GitBranch,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { OrganizationalContacts } from "@/components/contacts/OrganizationalContacts";
import { campusesService } from "@/services/campuses.service";
import { departmentsService, DepartmentCatalogItem } from "@/services/departments.service";
import { usersService } from "@/services/users.service";
import { GRANULAR_PERMISSIONS, CurrentUser } from "@/types/auth.types";


// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Global Network  (SUPER_SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
function GlobalNetworkView({
  campuses,
  members,
  vouchers,
  isLoading,
}: {
  campuses: any[];
  members: Member[];
  vouchers: CashVoucher[];
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Table: Campus Overview */}
      <div className="lg:col-span-8">
        <ComponentCard
          title="Performance & Effectifs par Campus"
          desc="Répartition multi-sites du Siège Mondial et des extensions HSC"
          action={
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {campuses.length} sites connectés
            </span>
          }
        >
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Campus & Ville</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Pasteur Dirigeant</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
            </TableHead>
            <TableBody>
              {campuses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                        {c.city.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white block text-xs">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {c.city}, {c.country}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="light"
                      color={
                        c.campus_type === "HQ"
                          ? "primary"
                          : c.campus_type === "EXTENSION"
                          ? "info"
                          : "warning"
                      }
                    >
                      {c.campus_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {c.lead_pastor_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs text-success-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                      Actif
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContainer>
        </ComponentCard>
      </div>

      {/* Side: Pipeline + Rapports */}
      <div className="lg:col-span-4 space-y-6">
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
              Pipeline d'Assimilation Réseau
            </h3>
            <Link
              href="/assimilation"
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              Voir Kanban <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-3.5 text-xs">
            {[
              { key: "ACCUEIL", label: "1. Accueil (1ères visites)" },
              { key: "MODULE_1", label: "2. Module 1 (Affermissement)" },
              { key: "MODULE_2", label: "3. Module 2 (Doctrine)" },
              { key: "BAPTEME", label: "4. Candidats au Baptême" },
              { key: "INTEGRE", label: "5. Intégration Départements" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  {label}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {members.filter((m: any) => m.assimilation_stage === key).length}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
            Rapports & Audit Réseau
          </h3>
          <div className="space-y-2 text-xs">
            <Link
              href="/finances/vouchers"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-500" />
                Circuit Pièces de Caisse
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>
            <Link
              href="/alerts"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-error-500" />
                Urgences Pastorales Actives
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Campus Level  (SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
function CampusAdminView({
  members,
  vouchers,
  isLoading,
}: {
  members: Member[];
  vouchers: CashVoucher[];
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <ComponentCard
          title="Dernières Pièces de Caisse du Campus"
          desc="Validation pastorale et traçabilité des décaissements"
          action={
            <Link href="/finances/vouchers">
              <Button variant="outline" size="sm">
                Gérer la Caisse
              </Button>
            </Link>
          }
        >
          <TableContainer>
            <TableHead>
              <TableHeaderCell>N° Pièce</TableHeaderCell>
              <TableHeaderCell>Bénéficiaire & Motif</TableHeaderCell>
              <TableHeaderCell>Montant</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Aucune pièce de caisse récente
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.slice(0, 5).map((vch) => (
                  <TableRow key={vch.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-gray-800 dark:text-white">
                        {vch.voucher_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold block text-gray-900 dark:text-white">
                        {vch.beneficiary}
                      </span>
                      <span className="text-[11px] text-gray-400">{vch.purpose}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {Number(vch.amount).toLocaleString("fr-FR")} FCFA
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="light"
                        color={
                          vch.status === "APPROVED" || vch.status === "DISBURSED"
                            ? "success"
                            : "warning"
                        }
                        size="sm"
                      >
                        {vch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {new Date(vch.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableContainer>
        </ComponentCard>
      </div>

      <div className="lg:col-span-4 space-y-6">
        {/* Pipeline assimilation */}
        <Card>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
              Pipeline d'Assimilation
            </h3>
            <Link
              href="/assimilation"
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              Kanban <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            {[
              { key: "ACCUEIL", label: "Accueil" },
              { key: "MODULE_1", label: "Module 1" },
              { key: "MODULE_2", label: "Module 2" },
              { key: "BAPTEME", label: "Baptême" },
              { key: "INTEGRE", label: "Intégré" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {members.filter((m: any) => m.assimilation_stage === key).length}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions rapides */}
        <Card>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
            Actions Rapides
          </h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              { href: "/members/new", label: "+ Enregistrer un nouveau membre" },
              { href: "/assimilation", label: "Ouvrir le Kanban d'assimilation" },
              { href: "/ai/ocr-vision", label: "Scan OCR Fiche de Présence" },
              { href: "/finances/vouchers", label: "Créer une pièce de caisse" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group"
              >
                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                  {label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Department Admin  (ADMIN_DEPT)
// ─────────────────────────────────────────────────────────────────────────────
function DeptAdminView({
  members,
  isLoading,
  currentUser,
}: {
  members: Member[];
  isLoading: boolean;
  currentUser: any;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <ComponentCard
          title="Membres de mon Département"
          desc="Suivi des membres affectés à votre département"
          action={
            <Link href="/members/new">
              <Button variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Ajouter
              </Button>
            </Link>
          }
        >
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Membre</TableHeaderCell>
              <TableHeaderCell>Fonction</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Étape</TableHeaderCell>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    Aucun membre dans votre département
                  </TableCell>
                </TableRow>
              ) : (
                members.slice(0, 8).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                        {m.first_name} {m.last_name}
                      </span>
                      <span className="text-[11px] text-gray-400">{m.phone}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {(m as any).ecclesial_function_display || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="light"
                        color={m.status === "ACTIF" ? "success" : "warning"}
                        size="sm"
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500">
                        {m.assimilation_stage || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableContainer>
        </ComponentCard>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
            Actions Département
          </h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              { href: "/members/new", label: "Enregistrer un membre" },
              { href: "/assimilation", label: "Pipeline d'assimilation" },
              { href: "/ai/ocr-vision", label: "Scan fiche de présence" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group"
              >
                <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                  {label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-2">
            Ma Délégation
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Permissions accordées par votre responsable
          </p>
          <div className="space-y-1.5">
            {currentUser?.delegated_permissions?.length > 0 ? (
              currentUser.delegated_permissions.map((p: string) => (
                <div
                  key={p}
                  className="flex items-center gap-2 text-xs text-success-700 dark:text-success-400"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{p}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune délégation active</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Adjoint / Membre (read-only)
// ─────────────────────────────────────────────────────────────────────────────
function AdjointView({ currentUser }: { currentUser: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
              Accès Délégué
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser?.is_deputy
                ? `Adjoint de ${currentUser?.deputy_of_name || "votre responsable"}`
                : "Vue Membre Fidèle"}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          {currentUser?.delegated_permissions?.length > 0 ? (
            currentUser.delegated_permissions.map((p: string) => (
              <div
                key={p}
                className="flex items-center gap-2 text-xs text-success-700 dark:text-success-400"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="capitalize">{p.replace(/_/g, " ")}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic">
              Aucune délégation spécifique
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
          Navigation Rapide
        </h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          {[
            { href: "/members", label: "Annuaire des membres" },
            { href: "/assimilation", label: "Suivi assimilation" },
            { href: "/directory", label: "Répertoire ecclésial" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                {label}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { currentCampus, isGlobalScope, campuses, currentUser, currentCampusId } =
    useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdmin,
    isAdminDept,
    isAdjoint,
    canManageMembers,
    role,
  } = useRole();

  const [members, setMembers] = useState<Member[]>([]);
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [usersList, setUsersList] = useState<CurrentUser[]>([]);
  const [catalogList, setCatalogList] = useState<DepartmentCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales d'actions de gouvernance (Sections 10 & 11)
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDeputyModalOpen, setIsDeputyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire Création d'Extension (Section 10)
  const [extensionForm, setExtensionForm] = useState({
    name: "",
    code: "",
    campus_type: "EXTENSION" as const,
    country: "Congo",
    city: "Pointe-Noire",
    address: "",
    parent: 1, // Église Mère Mpita par défaut
  });

  // Formulaire Création de Département (Section 11 & 8)
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    description: "",
    catalog_item: "" as string,
    admin: "",
    deputy: "",
  });

  // Formulaire Assignation d'Adjoint (Section 7 & 15)
  const [deputyForm, setDeputyForm] = useState({
    titulaireId: currentUser?.id || "",
    deputyId: "",
    permissions: ["voir", "creer"] as string[],
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [membersData, vouchersData, usersData, catalogData] = await Promise.all([
        membersService.getMembers(currentCampusId),
        financesService.getVouchers(currentCampusId),
        usersService.getUsers(currentCampusId),
        departmentsService.getCatalog(),
      ]);
      setMembers(membersData);
      setVouchers(vouchersData);
      setUsersList(usersData);
      setCatalogList(catalogData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentCampusId]);

  // Handler Création d'Extension (Super Super Admin)
  const handleCreateExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionForm.name || !extensionForm.city) return;

    setIsSubmitting(true);
    try {
      await campusesService.createCampus({
        name: extensionForm.name,
        code: extensionForm.code || `HSC-${extensionForm.city.toUpperCase().slice(0, 4)}`,
        campus_type: extensionForm.campus_type,
        country: extensionForm.country,
        city: extensionForm.city,
        address: extensionForm.address,
        parent: extensionForm.parent,
      });
      alert(`Nouvelle extension « ${extensionForm.name} » créée avec succès !`);
      setIsExtensionModalOpen(false);
      setExtensionForm({
        name: "",
        code: "",
        campus_type: "EXTENSION",
        country: "Congo",
        city: "Pointe-Noire",
        address: "",
        parent: 1,
      });
      await loadDashboardData();
    } catch (err) {
      alert("Erreur lors de la création de l'extension. Vérifiez les informations.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Création de Département (Super Admin)
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) return;

    setIsSubmitting(true);
    try {
      const activeCampusId = currentCampusId !== "all" ? Number(currentCampusId) : 1;
      await departmentsService.createDepartment({
        campus: activeCampusId,
        name: deptForm.name,
        code: deptForm.code || deptForm.name.toUpperCase().replace(/\s+/g, "_").slice(0, 15),
        description: deptForm.description,
        admin: deptForm.admin ? Number(deptForm.admin) : null,
        deputy: deptForm.deputy ? Number(deptForm.deputy) : null,
        catalog_item: deptForm.catalog_item ? Number(deptForm.catalog_item) : null,
      });
      alert(`Département « ${deptForm.name} » activé/créé pour l'Église !`);
      setIsDeptModalOpen(false);
      setDeptForm({
        name: "",
        code: "",
        description: "",
        catalog_item: "",
        admin: "",
        deputy: "",
      });
      await loadDashboardData();
    } catch (err) {
      alert("Erreur lors de la création du département.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Assignation d'Adjoint
  const handleAssignDeputy = async (e: React.FormEvent) => {
    e.preventDefault();
    const titulaireId = deputyForm.titulaireId || currentUser?.id;
    if (!titulaireId || !deputyForm.deputyId) return;

    setIsSubmitting(true);
    try {
      await usersService.assignDeputy(titulaireId, {
        deputy_id: deputyForm.deputyId,
        delegated_permissions: deputyForm.permissions,
      });
      alert("Adjoint et permissions déléguées enregistrés avec succès !");
      setIsDeputyModalOpen(false);
      setDeputyForm({
        titulaireId: currentUser?.id || "",
        deputyId: "",
        permissions: ["voir", "creer"],
      });
      await loadDashboardData();
    } catch (err) {
      alert("Erreur lors de l'assignation de l'adjoint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── KPI cards (adaptés au rôle) ────────────────────────────────────────────
  const totalMembers = members.length;
  const newMembers = members.filter((m) => m.status === "NOUVEAU").length;
  const totalDisbursed = vouchers
    .filter((v) => v.status === "DISBURSED")
    .reduce((acc, v) => acc + v.amount, 0);
  const pendingVouchers = vouchers.filter((v) => v.status === "PENDING").length;

  // ── Role badge label ────────────────────────────────────────────────────────
  const roleBadge = isSuperSuperAdmin
    ? "Vue Réseau Mondial Consolidée"
    : isSuperAdmin
    ? `Administration Campus · ${currentCampus?.name || ""}`
    : isAdminDept
    ? `Admin Département · ${currentCampus?.name || ""}`
    : isAdjoint
    ? "Vue Adjoint"
    : `Campus ${currentCampus?.name || ""}`;

  const roleIcon = isSuperSuperAdmin ? (
    <Globe2 className="w-3.5 h-3.5" />
  ) : (
    <Building2 className="w-3.5 h-3.5" />
  );

  return (
    <div className="space-y-6">
      {/* ── Top Banner ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 md:gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-1.5 shadow-md shrink-0 flex items-center justify-center border border-white/20">
              <img
                src="/logo-hsc.jpg"
                alt="Logo HSC"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-blue-200 text-xs font-medium mb-2 border border-white/10">
                {roleIcon}
                <span>{roleBadge}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Bienvenue,{" "}
                {currentUser
                  ? `${currentUser.title ? currentUser.title + " " : ""}${currentUser.last_name || ""}`.trim()
                  : "Cher Serviteur"}
              </h1>
              <p className="mt-1 text-sm text-blue-100/80 max-w-2xl leading-relaxed">
                {isSuperSuperAdmin
                  ? "Supervision globale du réseau HSC : implantations actives, consolidation des effectifs, gouvernance des extensions et alertes."
                  : isSuperAdmin
                  ? "Gestion opérationnelle du campus : culte dominical, départements, intendance financière et carnet pastoral."
                  : isAdminDept
                  ? "Administration de votre département : membres, présence et suivi pastoral."
                  : "Vue fidèle — accès aux informations de votre campus et de votre parcours d'assimilation."}
              </p>
            </div>
          </div>

          {/* Action buttons (spécifiques aux sections 10 & 11) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Super Super Admin : Bouton « + Créer une extension » (Section 10) */}
            {isSuperSuperAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsExtensionModalOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md"
              >
                <GitBranch className="w-4 h-4 mr-1.5" />
                + Créer une extension
              </Button>
            )}

            {/* Super Admin : Bouton « + Créer un département » (Section 11) */}
            {isSuperAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsDeptModalOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md"
              >
                <FolderPlus className="w-4 h-4 mr-1.5" />
                + Créer un département
              </Button>
            )}

            {/* Super Super Admin & Super Admin : Bouton « + Ajouter un adjoint » (Sections 10 & 11) */}
            {(isSuperSuperAdmin || isSuperAdmin) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeputyModalOpen(true)}
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                <UserCheck className="w-4 h-4 mr-1.5" />
                + Ajouter un adjoint
              </Button>
            )}

            {canManageMembers && (
              <Link href="/members/new">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Nouveau Membre
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* ── KPI StatCards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          title={
            isSuperSuperAdmin
              ? "Membres Totaux Réseau"
              : isAdminDept
              ? "Membres du Département"
              : "Membres du Campus"
          }
          value={isLoading ? "…" : totalMembers.toString()}
          change="+8.4%"
          trend="up"
          subtitle="Enregistrés et suivis"
          icon={<Users className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />

        <StatCard
          title="Nouveaux Venus"
          value={isLoading ? "…" : newMembers.toString()}
          change="Personnes à intégrer"
          trend="up"
          subtitle="Module d'accueil en cours"
          icon={<Church className="w-6 h-6 text-blue-light-500" />}
          iconBgColor="bg-blue-light-50 dark:bg-blue-light-500/15"
        />

        {(isSuperSuperAdmin || isSuperAdmin) && (
          <StatCard
            title="Décaissements Clôturés"
            value={
              isLoading
                ? "…"
                : totalDisbursed.toLocaleString("fr-FR") + " F"
            }
            change="Pièces justifiées"
            trend="up"
            subtitle="Pièces de caisse clôturées"
            icon={<Wallet className="w-6 h-6 text-success-500" />}
            iconBgColor="bg-success-50 dark:bg-success-500/15"
          />
        )}

        {isAdminDept && (
          <StatCard
            title="Pièces en Attente"
            value={isLoading ? "…" : pendingVouchers.toString()}
            change="À valider"
            trend={pendingVouchers > 0 ? "up" : "neutral"}
            subtitle="Nécessite validation"
            icon={<Layers className="w-6 h-6 text-warning-500" />}
            iconBgColor="bg-warning-50 dark:bg-warning-500/15"
          />
        )}

        <StatCard
          title="Alertes Pastorales"
          value="0"
          change="0 critique"
          trend="down"
          subtitle="Aucune alerte active"
          icon={<ShieldAlert className="w-6 h-6 text-error-500" />}
          iconBgColor="bg-error-50 dark:bg-error-500/15"
        />
      </div>

      {/* ── Layout Principal avec Carnet de Contacts (Section 24) ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Contenu Métier Principal (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {isSuperSuperAdmin ? (
            <GlobalNetworkView
              campuses={campuses}
              members={members}
              vouchers={vouchers}
              isLoading={isLoading}
            />
          ) : isSuperAdmin ? (
            <CampusAdminView
              members={members}
              vouchers={vouchers}
              isLoading={isLoading}
            />
          ) : isAdminDept ? (
            <DeptAdminView
              members={members}
              isLoading={isLoading}
              currentUser={currentUser}
            />
          ) : (
            <AdjointView currentUser={currentUser} />
          )}
        </div>

        {/* Espace latéral : Carnet de Contacts Organisationnel (Section 24) (4 cols) */}
        <div className="xl:col-span-4">
          <OrganizationalContacts
            campusId={currentCampusId}
            isGlobalScope={isGlobalScope}
          />
        </div>
      </div>

      {/* ── Modal: Création d'une Extension (Section 10 - Super Super Admin) ── */}
      <Modal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        title="Créer une Nouvelle Église ou Extension (Global)"
      >
        <form onSubmit={handleCreateExtension} className="space-y-4">
          <p className="text-xs text-gray-500">
            En tant que Super Super Admin, vous pouvez implanter une nouvelle église autonome rattachée à l'Église Mère ou à une église parent.
          </p>

          <div>
            <Label required>Nom de l'Église / Extension</Label>
            <Input
              required
              value={extensionForm.name}
              onChange={(e) => setExtensionForm({ ...extensionForm, name: e.target.value })}
              placeholder="Ex: Extension Pointe-Noire Ouest"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Ville</Label>
              <Input
                required
                value={extensionForm.city}
                onChange={(e) => setExtensionForm({ ...extensionForm, city: e.target.value })}
                placeholder="Ex: Pointe-Noire, Brazzaville..."
              />
            </div>
            <div>
              <Label required>Pays</Label>
              <Input
                required
                value={extensionForm.country}
                onChange={(e) => setExtensionForm({ ...extensionForm, country: e.target.value })}
                placeholder="Ex: Congo, RDC, France..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code d'identification</Label>
              <Input
                value={extensionForm.code}
                onChange={(e) => setExtensionForm({ ...extensionForm, code: e.target.value })}
                placeholder="Ex: HSC-PNO"
              />
            </div>
            <div>
              <Label required>Église Parent (Hiérarchie)</Label>
              <select
                value={extensionForm.parent}
                onChange={(e) => setExtensionForm({ ...extensionForm, parent: Number(e.target.value) })}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Adresse physique du lieu de culte</Label>
            <Input
              value={extensionForm.address}
              onChange={(e) => setExtensionForm({ ...extensionForm, address: e.target.value })}
              placeholder="Quartier, Avenue, Référence..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsExtensionModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Créer l'Extension
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Création / Activation de Département (Section 11 & 8 - Super Admin) ── */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Créer ou Activer un Département (Église Locale)"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <p className="text-xs text-gray-500">
            Activez une structure issue du catalogue recommandé ou créez un département sur mesure pour votre église.
          </p>

          <div>
            <Label>Choisir depuis le Catalogue Recommandé (Optionnel)</Label>
            <select
              value={deptForm.catalog_item}
              onChange={(e) => {
                const catId = e.target.value;
                const found = catalogList.find((c) => String(c.id) === catId);
                if (found) {
                  setDeptForm({
                    ...deptForm,
                    catalog_item: catId,
                    name: found.name,
                    code: found.code,
                    description: found.description,
                  });
                } else {
                  setDeptForm({ ...deptForm, catalog_item: "" });
                }
              }}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Création libre ou personnalisée --</option>
              {catalogList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label required>Nom du Département / Structure</Label>
            <Input
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="Ex: Ministère des Jeunes, Chorale, Protocole..."
            />
          </div>

          <div>
            <Label>Description & Missions</Label>
            <Input
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Rôle et vocation du département..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Administrateur Titulaire (Admin Dept)</Label>
              <select
                value={deptForm.admin}
                onChange={(e) => setDeptForm({ ...deptForm, admin: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="">-- Aucun pour l'instant --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Adjoint du Département</Label>
              <select
                value={deptForm.deputy}
                onChange={(e) => setDeptForm({ ...deptForm, deputy: e.target.value })}
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="">-- Aucun adjoint --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Activer le Département
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Ajout d'Adjoint & Permissions (Sections 10 & 11) ─────────── */}
      <Modal
        isOpen={isDeputyModalOpen}
        onClose={() => setIsDeputyModalOpen(false)}
        title="Désigner un Adjoint & Attribuer des Permissions"
      >
        <form onSubmit={handleAssignDeputy} className="space-y-4">
          <p className="text-xs text-gray-500">
            Désignez votre adjoint pour vous épauler dans la gestion de votre périmètre et définissez ses permissions précises.
          </p>

          <div>
            <Label required>Titulaire Responsable</Label>
            <Input
              disabled
              value={`${currentUser?.title ? currentUser.title + " " : ""}${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`}
            />
          </div>

          <div>
            <Label required>Choisir l'Adjoint</Label>
            <select
              required
              value={deputyForm.deputyId}
              onChange={(e) => setDeputyForm({ ...deputyForm, deputyId: e.target.value })}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Choisir un serviteur / membre --</option>
              {usersList
                .filter((u) => u.id !== currentUser?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label required>Permissions Déléguées (Section 15)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
              {GRANULAR_PERMISSIONS.map((perm) => {
                const isChecked = deputyForm.permissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                      isChecked
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 text-brand-900 dark:text-brand-200"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDeputyForm({
                            ...deputyForm,
                            permissions: [...deputyForm.permissions, perm.key],
                          });
                        } else {
                          setDeputyForm({
                            ...deputyForm,
                            permissions: deputyForm.permissions.filter((p) => p !== perm.key),
                          });
                        }
                      }}
                      className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-semibold capitalize">{perm.label}</p>
                      <p className="text-[10px] text-gray-400">{perm.desc}</p>
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
              Confirmer l'Adjoint
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

