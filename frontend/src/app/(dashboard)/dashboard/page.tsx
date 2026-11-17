"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { membersService } from "@/services/members.service";
import { financesService } from "@/services/finances.service";
import { patrimoineService } from "@/services/patrimoine.service";
import { Member } from "@/types/member.types";
import { CashVoucher, FinancialEntry } from "@/types/finance.types";
import { Asset, StockItem } from "@/types/patrimoine.types";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { ChoraleRehearsalsWidget } from "@/components/dashboard/ChoraleRehearsalsWidget";
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
  UserPlus,
  FolderPlus,
  GitBranch,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { OrganizationalContacts } from "@/components/contacts/OrganizationalContacts";
import { CreateUserModal } from "@/components/users/CreateUserModal";
import { campusesService } from "@/services/campuses.service";
import { departmentsService, DepartmentCatalogItem, DepartmentItem } from "@/services/departments.service";
import { usersService } from "@/services/users.service";
import { GRANULAR_PERMISSIONS, CurrentUser } from "@/types/auth.types";


// ─────────────────────────────────────────────────────────────────────────────
// Sub-view: Global Network  (SUPER_SUPER_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
function GlobalNetworkView({
  campuses,
  members,
  vouchers,
  assets,
  alerts,
  isLoading,
  onOpenCreateUser,
  onSelectCampus,
}: {
  campuses: any[];
  members: Member[];
  vouchers: CashVoucher[];
  assets: Asset[];
  alerts: any[];
  isLoading: boolean;
  onOpenCreateUser?: () => void;
  onSelectCampus?: (campusId: string) => void;
}) {
  const activeCampuses = campuses.filter((c) => c.is_active !== false).length;
  const inactiveCampuses = campuses.length - activeCampuses;
  const consolidatedVnc = assets.reduce(
    (sum, a) => sum + Number((a as any).amount_in_hq_currency ?? a.net_book_value ?? a.estimated_value ?? 0),
    0
  );
  const voucherHqTotal = vouchers.reduce(
    (sum, v) => sum + Number((v as any).amount_in_hq_currency ?? v.amount ?? 0),
    0
  );
  const localCurrencyTotals = vouchers.reduce<Record<string, number>>((acc, v) => {
    const cur = ((v as any).currency || (v as any).campus_currency || "XAF").toUpperCase();
    acc[cur] = (acc[cur] || 0) + Number(v.amount ?? 0);
    return acc;
  }, {});
  const localCurrencySummary = Object.entries(localCurrencyTotals)
    .map(([cur, total]) => formatCurrency(total, cur))
    .join(" • ");
  const activeAlertsCount = alerts.filter((a) => a.status !== "RESOLVED").length;

  const countryBreakdown = campuses.reduce<Record<string, number>>((acc, c) => {
    const key = `${c.country || "N/A"} (${c.city || "N/A"})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Table: Campus Overview & Pasteurs Dirigeants */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <span className="text-[11px] text-gray-500 block">Églises du Réseau</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">
              {campuses.length} <span className="text-xs font-normal text-success-600">({activeCampuses} actives / {inactiveCampuses} inactives)</span>
            </span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Consolidation Multi-Devises (Siège HQ)</span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400 tabular-nums block mt-0.5">
              {formatCurrency(consolidatedVnc, "XAF")}
            </span>
            <span className="text-[11px] text-gray-400 tabular-nums block mt-1">
              Pièces : {formatCurrency(voucherHqTotal, "XAF")}
              {localCurrencySummary ? ` (${localCurrencySummary})` : ""}
            </span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Alertes Pastorales Actives</span>
            <span className="text-lg font-bold text-error-600 block mt-0.5">
              {activeAlertsCount}
            </span>
          </Card>
        </div>
        <ComponentCard
          title="Performance & Effectifs par Campus"
          desc="Cliquez sur une Église ou extension pour inspecter son périmètre"
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={onOpenCreateUser}
                className="text-xs flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Nommer un Pasteur
              </Button>
              <Link
                href="/users"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Gérer les comptes →
              </Link>
            </div>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : campuses.length === 0 ? (
            <EmptyState
              title="Aucun campus configuré"
              description="Créez votre Église mère ou une extension pour démarrer la consolidation multi-sites."
            />
          ) : (
            <TableContainer>
            <TableHead>
              <TableHeaderCell>Campus & Ville</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Pasteur Dirigeant</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
            </TableHead>
            <TableBody>
              {campuses.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => onSelectCampus && onSelectCampus(String(c.id))}
                  className="cursor-pointer hover:bg-brand-50/40 dark:hover:bg-white/5 transition-colors"
                >
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
                    {c.is_active !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-success-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Inactif
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContainer>
          )}
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
            Répartition Pays & Villes
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(countryBreakdown).map(([loc, count]) => (
              <div
                key={loc}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="text-gray-600 dark:text-gray-300">{loc}</span>
                <span className="font-bold text-gray-900 dark:text-white">{count}</span>
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
  departments,
  brigades,
  assets,
  transactions,
  isLoading,
  onOpenCreateUser,
}: {
  members: Member[];
  vouchers: CashVoucher[];
  departments: DepartmentItem[];
  brigades: any[];
  assets: Asset[];
  transactions: FinancialEntry[];
  isLoading: boolean;
  onOpenCreateUser?: () => void;
}) {
  const activeDeptsCount = departments.filter((d) => d.is_active).length;
  const activeBrigadesCount = brigades.filter((b) => b.is_active !== false).length;
  const campusCredits = transactions.filter((t) => t.entry_type === "CREDIT").reduce((s, t) => s + Number(t.amount || 0), 0);
  const campusDebits = transactions.filter((t) => t.entry_type === "DEBIT").reduce((s, t) => s + Number(t.amount || 0), 0);
  const campusBalance = campusCredits - campusDebits;
  const campusVnc = assets.reduce((s, a) => s + Number(a.net_book_value ?? a.estimated_value ?? 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        {/* Synthèse Campus : Départements, GDC/Brigades, Finances, Patrimoine */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <span className="text-[11px] text-gray-500 block">Départements Actifs</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">
              {activeDeptsCount}
            </span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">GDC / Brigades</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">
              {activeBrigadesCount}
            </span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Solde Trésorerie</span>
            <span className="text-lg font-bold text-success-600 block mt-0.5">
              {campusBalance.toLocaleString("fr-FR")} F
            </span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">VNC Patrimoine</span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400 block mt-0.5">
              {campusVnc.toLocaleString("fr-FR")} F
            </span>
          </Card>
        </div>

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
          {isLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : vouchers.length === 0 ? (
            <EmptyState
              title="Aucune pièce de caisse récente"
              description="Les demandes de décaissement et validations pastorales du campus apparaîtront ici."
            />
          ) : (
            <TableContainer>
              <TableHead>
                <TableHeaderCell>N° Pièce</TableHeaderCell>
                <TableHeaderCell>Bénéficiaire & Motif</TableHeaderCell>
                <TableHeaderCell>Montant</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
              </TableHead>
              <TableBody>
                {vouchers.slice(0, 5).map((vch) => (
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
                      <span className="text-xs font-bold tabular-nums text-gray-900 dark:text-white">
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
                ))}
              </TableBody>
            </TableContainer>
          )}
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
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
              Actions Rapides & Gouvernance
            </h3>
            {onOpenCreateUser && (
              <Button
                size="sm"
                variant="default"
                onClick={onOpenCreateUser}
                className="text-xs flex items-center gap-1.5 py-1 px-2.5 h-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Créer un Compte
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {onOpenCreateUser && (
              <button
                type="button"
                onClick={onOpenCreateUser}
                className="p-3 rounded-xl border border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-500/10 hover:border-brand-500 flex items-center justify-between transition-colors text-left group"
              >
                <span className="font-semibold text-brand-700 dark:text-brand-300 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  + Créer un compte serviteur local
                </span>
                <ArrowRight className="w-4 h-4 text-brand-500" />
              </button>
            )}
            <Link
              href="/users"
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group"
            >
              <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                Gérer les comptes & adjoints du campus
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
            </Link>
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
// Sub-view: Department Admin Mini-Dashboards (Section 9 & 20)
// ─────────────────────────────────────────────────────────────────────────────
function DeptAdminView({
  members,
  vouchers,
  assets,
  stocks,
  transactions,
  alerts,
  departmentCodes,
  isLoading,
  currentUser,
  isFinanceDept,
  isPatrimoineDept,
  isChoraleDept,
  onOpenDeputyModal,
}: {
  members: Member[];
  vouchers: CashVoucher[];
  assets: Asset[];
  stocks: StockItem[];
  transactions: FinancialEntry[];
  alerts: any[];
  departmentCodes: string[];
  isLoading: boolean;
  currentUser: any;
  isFinanceDept: boolean;
  isPatrimoineDept: boolean;
  isChoraleDept: boolean;
  onOpenDeputyModal?: () => void;
}) {
  // 1. Mini-Dashboard Financier (Section 9 : Admin Finance)
  if (isFinanceDept) {
    const totalCredits = transactions.filter((t) => t.entry_type === "CREDIT").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalDebits = transactions.filter((t) => t.entry_type === "DEBIT").reduce((s, t) => s + Number(t.amount || 0), 0);
    const balance = totalCredits - totalDebits;
    const pendingCount = vouchers.filter((v) => v.status === "PENDING").length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <span className="text-[11px] text-gray-500 block">Recettes (Crédits)</span>
            <span className="text-lg font-bold text-success-600 block mt-0.5">+{totalCredits.toLocaleString("fr-FR")} F</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Dépenses (Débits)</span>
            <span className="text-lg font-bold text-error-600 block mt-0.5">-{totalDebits.toLocaleString("fr-FR")} F</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Solde Net</span>
            <span className="text-lg font-bold text-brand-600 block mt-0.5">{balance.toLocaleString("fr-FR")} F</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Pièces en Attente</span>
            <span className="text-lg font-bold text-warning-600 block mt-0.5">{pendingCount}</span>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ComponentCard
            title="Mini-Dashboard Financier · Pièces de Caisse"
            desc="Pilotage de la trésorerie et suivi des décaissements de l'Église (Section 9 & 12)"
            action={
              <Link href="/finances/vouchers">
                <Button variant="default" size="sm">
                  <Receipt className="w-4 h-4 mr-1.5" />
                  Ouvrir la Caisse
                </Button>
              </Link>
            }
          >
            {isLoading ? (
              <TableSkeleton rows={4} columns={4} />
            ) : vouchers.length === 0 ? (
              <EmptyState
                title="Aucune pièce de caisse enregistrée"
                description="Les demandes de décaissement et validations pastorales apparaîtront ici."
              />
            ) : (
              <TableContainer>
                <TableHead>
                  <TableHeaderCell>N° Pièce</TableHeaderCell>
                  <TableHeaderCell>Bénéficiaire & Motif</TableHeaderCell>
                  <TableHeaderCell>Montant</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {vouchers.slice(0, 8).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold">{v.voucher_number}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold block">{v.beneficiary}</span>
                        <span className="text-[11px] text-gray-400">{v.purpose}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold tabular-nums">
                          {Number(v.amount).toLocaleString("fr-FR")} FCFA
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="light"
                          color={
                            v.status === "DISBURSED"
                              ? "success"
                              : v.status === "APPROVED"
                              ? "info"
                              : "warning"
                          }
                          size="sm"
                        >
                          {v.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableContainer>
            )}
          </ComponentCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
              Actions Département Finances
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                href="/finances/vouchers"
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors"
              >
                <span className="font-medium">Gérer les Pièces de Caisse</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/finances/journal"
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors"
              >
                <span className="font-medium">Consulter le Journal Financier</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              {onOpenDeputyModal && !currentUser?.is_deputy && (
                <button
                  type="button"
                  onClick={onOpenDeputyModal}
                  className="p-3 rounded-xl border border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-500/10 flex items-center justify-between text-brand-700 dark:text-brand-300 font-semibold"
                >
                  <span>+ Ajouter / Gérer mon Adjoint</span>
                  <UserCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
      </div>
    );
  }

  // 2. Mini-Dashboard Patrimonial (Section 9 : Admin Patrimoine)
  if (isPatrimoineDept) {
    const grossTotal = assets.reduce((s, a) => s + Number(a.purchase_price ?? a.estimated_value ?? 0), 0);
    const vncTotal = assets.reduce((s, a) => s + Number(a.net_book_value ?? a.estimated_value ?? 0), 0);
    const lowStockAlerts = stocks.filter((st) => st.quantity_in_stock <= st.alert_threshold).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <span className="text-[11px] text-gray-500 block">Nombre d'Actifs</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">{assets.length}</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Valeur Brute</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">{grossTotal.toLocaleString("fr-FR")} F</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Valeur Nette (VNC)</span>
            <span className="text-lg font-bold text-brand-600 block mt-0.5">{vncTotal.toLocaleString("fr-FR")} F</span>
          </Card>
          <Card>
            <span className="text-[11px] text-gray-500 block">Alertes Stock</span>
            <span className="text-lg font-bold text-error-600 block mt-0.5">{lowStockAlerts}</span>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ComponentCard
            title="Mini-Dashboard Patrimoine · Actifs & Amortissements"
            desc="Suivi des immobilisations, amortissement linéaire et VNC (Section 9 & 13)"
            action={
              <Link href="/patrimoine/assets">
                <Button variant="default" size="sm">
                  Ouvrir le Registre des Biens
                </Button>
              </Link>
            }
          >
            {isLoading ? (
              <TableSkeleton rows={4} columns={5} />
            ) : assets.length === 0 ? (
              <EmptyState
                title="Aucun actif enregistré"
                description="Enregistrez vos équipements et immobilisations pour suivre leur amortissement et VNC."
              />
            ) : (
              <TableContainer>
                <TableHead>
                  <TableHeaderCell>Code</TableHeaderCell>
                  <TableHeaderCell>Équipement</TableHeaderCell>
                  <TableHeaderCell>Valeur Brute</TableHeaderCell>
                  <TableHeaderCell>Amort. Cumulé</TableHeaderCell>
                  <TableHeaderCell>VNC</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {assets.slice(0, 6).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell><span className="font-mono text-xs font-bold">{a.asset_code}</span></TableCell>
                      <TableCell><span className="text-xs font-semibold">{a.name}</span></TableCell>
                      <TableCell><span className="text-xs tabular-nums">{Number(a.purchase_price || 0).toLocaleString("fr-FR")} F</span></TableCell>
                      <TableCell><span className="text-xs tabular-nums text-warning-600">-{Number(a.accumulated_depreciation || 0).toLocaleString("fr-FR")} F</span></TableCell>
                      <TableCell><span className="text-xs font-bold tabular-nums text-brand-600">{Number(a.net_book_value ?? a.estimated_value ?? 0).toLocaleString("fr-FR")} F</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableContainer>
            )}
          </ComponentCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
              Actions Département Patrimoine
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                href="/patrimoine/assets"
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between"
              >
                <span className="font-medium">Registre du Patrimoine</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                href="/patrimoine/stocks"
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between"
              >
                <span className="font-medium">Mouvements de Stocks</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              {onOpenDeputyModal && !currentUser?.is_deputy && (
                <button
                  type="button"
                  onClick={onOpenDeputyModal}
                  className="p-3 rounded-xl border border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-500/10 flex items-center justify-between text-brand-700 dark:text-brand-300 font-semibold"
                >
                  <span>+ Ajouter / Gérer mon Adjoint</span>
                  <UserCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
      </div>
    );
  }

  // 3. Mini-Dashboard Chorale / Accueil / Social / Secrétariat / Structure (Section 9)
  const adminDeptIds = new Set((currentUser?.administered_departments || []).map((d: any) => Number(d.id)));
  const scopedMembers =
    adminDeptIds.size > 0 && !departmentCodes.some((c) => ["ACCUEIL", "SECRETARIAT", "SOCIAL", "BRIGADE", "GDC"].includes(c))
      ? members.filter((m) => m.department && adminDeptIds.has(Number(m.department)))
      : members;

  const isAccueilOrSocialOrSec = departmentCodes.some((c) => ["ACCUEIL", "SOCIAL", "SECRETARIAT"].includes(c));
  const newComersCount = scopedMembers.filter((m) => m.status === "NOUVEAU").length;
  const activeAlertsCount = alerts.filter((a) => a.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      {(isChoraleDept || isAccueilOrSocialOrSec) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isChoraleDept ? (
            <>
              <Card>
                <span className="text-[11px] text-gray-500 block">Chantres & Musiciens</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">{scopedMembers.length}</span>
              </Card>
              <Card>
                <span className="text-[11px] text-gray-500 block">Prochaine Répétition</span>
                <span className="text-sm font-bold text-brand-600 block mt-0.5">Samedi · 15h00 (Sanctuaire)</span>
              </Card>
              <Card>
                <span className="text-[11px] text-gray-500 block">Culte Dominical</span>
                <span className="text-sm font-bold text-success-600 block mt-0.5">Dimanche · 08h30 & 11h00</span>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <span className="text-[11px] text-gray-500 block">Nouveaux Venus</span>
                <span className="text-lg font-bold text-brand-600 block mt-0.5">{newComersCount}</span>
              </Card>
              <Card>
                <span className="text-[11px] text-gray-500 block">Alertes Sociales / Pastorales</span>
                <span className="text-lg font-bold text-error-600 block mt-0.5">{activeAlertsCount}</span>
              </Card>
              <Card>
                <span className="text-[11px] text-gray-500 block">Total Fidèles Suivis</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white block mt-0.5">{scopedMembers.length}</span>
              </Card>
            </>
          )}
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <ComponentCard
          title={
            isChoraleDept
              ? "Mini-Dashboard Chorale · Membres, Répétitions & Présence"
              : "Membres & Activités de ma Structure"
          }
          desc="Suivi des membres, présence et tâches propres à votre département"
          action={
            <Link href="/members/new">
              <Button variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Ajouter
              </Button>
            </Link>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : scopedMembers.length === 0 ? (
            <EmptyState
              title="Aucun membre dans votre département"
              description="Ajoutez des membres ou nouveaux venus pour suivre leur parcours dans votre structure."
            />
          ) : (
            <TableContainer>
              <TableHead>
                <TableHeaderCell>Membre</TableHeaderCell>
                <TableHeaderCell>Fonction</TableHeaderCell>
                <TableHeaderCell>Statut</TableHeaderCell>
                <TableHeaderCell>Étape</TableHeaderCell>
              </TableHead>
              <TableBody>
                {scopedMembers.slice(0, 8).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                        {m.first_name} {m.last_name}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-gray-400">{m.phone}</span>
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
                ))}
              </TableBody>
            </TableContainer>
          )}
        </ComponentCard>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card>
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
            Actions de la Structure
          </h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              { href: "/members/new", label: "Enregistrer un membre" },
              { href: "/assimilation", label: "Pipeline d'assimilation" },
              { href: "/ai/ocr-vision", label: "Scan fiche de présence" },
              { href: "/departments", label: "Gérer mon département" },
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
            {onOpenDeputyModal && !currentUser?.is_deputy && (
              <button
                type="button"
                onClick={onOpenDeputyModal}
                className="p-3 rounded-xl border border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-500/10 flex items-center justify-between text-brand-700 dark:text-brand-300 font-semibold"
              >
                <span>+ Ajouter / Gérer mon Adjoint</span>
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>

    {isChoraleDept && (
      <ChoraleRehearsalsWidget
        campusId={currentUser?.campus_id || currentUser?.campus}
        members={scopedMembers}
      />
    )}
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
  const {
    currentCampus,
    isGlobalScope,
    campuses,
    currentUser,
    currentCampusId,
    setCurrentCampusId,
  } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdmin,
    isAdminDept,
    isAdjoint,
    isFinanceDept,
    isPatrimoineDept,
    isChoraleDept,
    departmentCodes,
    canCreateExtension,
    canManageDepartments,
    canAssignDeputy,
    canManageMembers,
    canManageUsers,
    role,
  } = useRole();

  const [members, setMembers] = useState<Member[]>([]);
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<FinancialEntry[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [brigades, setBrigades] = useState<any[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [usersList, setUsersList] = useState<CurrentUser[]>([]);
  const [catalogList, setCatalogList] = useState<DepartmentCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales d'actions de gouvernance (Sections 10 & 11)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDeputyModalOpen, setIsDeputyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire Création d'Extension (Section 10 & 20)
  const [extensionForm, setExtensionForm] = useState({
    name: "",
    code: "",
    campus_type: "EXTENSION" as const,
    country: "Congo",
    city: "Pointe-Noire",
    address: "",
    parent: 1, // Église Mère Mpita par défaut
    lead_pastor: "" as string,
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

  const isStrictlyFinanceOrPatrimoine =
    isAdminDept && (isFinanceDept || isPatrimoineDept) && !isChoraleDept;

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const canFetchPatrimoine = isSuperSuperAdmin || isSuperAdmin || isPatrimoineDept;
      const canFetchTransactions = isSuperSuperAdmin || isSuperAdmin || isFinanceDept;
      const canFetchMembersAndAlerts = !isStrictlyFinanceOrPatrimoine;

      const [
        membersData,
        vouchersData,
        usersData,
        catalogData,
        assetsData,
        stocksData,
        transactionsData,
        alertsData,
        brigadesData,
        departmentsData,
      ] = await Promise.all([
        canFetchMembersAndAlerts ? membersService.getMembers(currentCampusId) : Promise.resolve([]),
        financesService.getVouchers(currentCampusId),
        usersService.getUsers(currentCampusId),
        departmentsService.getCatalog(),
        canFetchPatrimoine ? patrimoineService.getAssets(currentCampusId) : Promise.resolve([]),
        canFetchPatrimoine ? patrimoineService.getStocks(currentCampusId) : Promise.resolve([]),
        canFetchTransactions ? financesService.getJournalEntries(currentCampusId) : Promise.resolve([]),
        canFetchMembersAndAlerts ? membersService.getAlerts(currentCampusId) : Promise.resolve([]),
        canFetchMembersAndAlerts ? membersService.getBrigades(currentCampusId) : Promise.resolve([]),
        departmentsService.getDepartments(currentCampusId),
      ]);
      setMembers(membersData);
      setVouchers(vouchersData);
      setUsersList(usersData);
      setCatalogList(catalogData);
      setAssets(assetsData);
      setStocks(stocksData);
      setTransactions(transactionsData);
      setAlerts(alertsData);
      setBrigades(brigadesData);
      setDepartments(departmentsData);
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
      const payload: any = {
        name: extensionForm.name,
        code: extensionForm.code || `HSC-${extensionForm.city.toUpperCase().slice(0, 4)}`,
        campus_type: extensionForm.campus_type,
        country: extensionForm.country,
        city: extensionForm.city,
        address: extensionForm.address,
        parent: extensionForm.parent,
      };
      if (extensionForm.lead_pastor) {
        payload.lead_pastor = Number(extensionForm.lead_pastor);
      }
      await campusesService.createCampus(payload);
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
        lead_pastor: "",
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
    .reduce((acc, v) => acc + Number(v.amount || 0), 0);
  const pendingVouchers = vouchers.filter((v) => v.status === "PENDING").length;
  const activeAlertsCount = alerts.filter((a) => a.status !== "RESOLVED").length;
  const openAlertsCount = alerts.filter((a) => a.status === "OPEN").length;

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
            {/* Super Super Admin & Super Admin : Bouton direct « + Créer un Compte Responsable / Nommer un Pasteur » */}
            {canManageUsers && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateUserModalOpen(true)}
                className="bg-white text-brand-700 hover:bg-white/90 font-bold shadow-md"
              >
                <UserPlus className="w-4 h-4 mr-1.5 text-brand-600" />
                {isSuperSuperAdmin
                  ? "+ Nommer un Pasteur / Créer un Compte"
                  : "+ Créer un Compte Responsable"}
              </Button>
            )}

            {(isSuperSuperAdmin || isSuperAdmin) && (
              <Link href="/users">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
                >
                  <UserCheck className="w-4 h-4 mr-1.5" />
                  Gérer les Comptes & Rôles
                </Button>
              </Link>
            )}

            {/* Super Super Admin : Bouton « + Créer une extension » (Section 10) */}
            {canCreateExtension && (
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
            {canManageDepartments && (
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

            {/* Titulaire à chaque niveau (SSA, SA, Admin Dept) : Bouton « + Ajouter un adjoint » (Sections 7, 10, 11, 19) */}
            {canAssignDeputy && (
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
        {!isStrictlyFinanceOrPatrimoine && (
          <>
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
          </>
        )}

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
          value={isLoading ? "…" : activeAlertsCount.toString()}
          change={`${openAlertsCount} ouverte(s)`}
          trend={activeAlertsCount > 0 ? "up" : "down"}
          subtitle={activeAlertsCount > 0 ? "À traiter par l'équipe pastorale" : "Aucune alerte active"}
          icon={<ShieldAlert className="w-6 h-6 text-error-500" />}
          iconBgColor="bg-error-50 dark:bg-error-500/15"
        />
      </div>

      {/* ── Layout Principal avec Carnet de Contacts (Section 24) ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Contenu Métier Principal (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {currentUser?.is_deputy && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Mode Adjoint Délégué — Vous agissez dans le périmètre de{" "}
                <strong>{currentUser.deputy_of_name || "votre titulaire"}</strong>
              </span>
              <span className="font-mono text-[11px]">
                Permissions : {(currentUser.delegated_permissions || []).join(", ") || "lecture"}
              </span>
            </div>
          )}

          {isSuperSuperAdmin ? (
            <GlobalNetworkView
              campuses={campuses}
              members={members}
              vouchers={vouchers}
              assets={assets}
              alerts={alerts}
              isLoading={isLoading}
              onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
              onSelectCampus={(id) => setCurrentCampusId(id)}
            />
          ) : isSuperAdmin ? (
            <CampusAdminView
              members={members}
              vouchers={vouchers}
              departments={departments}
              brigades={brigades}
              assets={assets}
              transactions={transactions}
              isLoading={isLoading}
              onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
            />
          ) : isAdminDept ? (
            <DeptAdminView
              members={members}
              vouchers={vouchers}
              assets={assets}
              stocks={stocks}
              transactions={transactions}
              alerts={alerts}
              departmentCodes={departmentCodes}
              isLoading={isLoading}
              currentUser={currentUser}
              isFinanceDept={isFinanceDept}
              isPatrimoineDept={isPatrimoineDept}
              isChoraleDept={isChoraleDept}
              onOpenDeputyModal={() => setIsDeputyModalOpen(true)}
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

          <div>
            <Label>Attribuer un Super Admin (Pasteur / Berger dirigeant)</Label>
            <select
              value={extensionForm.lead_pastor}
              onChange={(e) => setExtensionForm({ ...extensionForm, lead_pastor: e.target.value })}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Nommer plus tard ou choisir un responsable existant --</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title ? `${u.title} ` : ""}{u.first_name} {u.last_name} ({u.username})
                </option>
              ))}
            </select>
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

      {/* Modal Création de Compte & Nomination selon Matrice RBAC */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

