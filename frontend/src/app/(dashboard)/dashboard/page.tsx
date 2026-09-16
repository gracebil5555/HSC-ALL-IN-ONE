"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { membersService } from "@/services/members.service";
import { financesService } from "@/services/finances.service";
import { Member } from "@/types/member.types";
import { CashVoucher } from "@/types/finance.types";
import { useTenant } from "@/context/TenantContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import {
  Users,
  Church,
  Wallet,
  ShieldAlert,
  Building2,
  Globe2,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Mic,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function DashboardPage() {
  const { currentCampus, isGlobalScope, campuses, currentUser, currentCampusId } = useTenant();

  const [members, setMembers] = useState<Member[]>([]);
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [membersData, vouchersData] = await Promise.all([
          membersService.getMembers(currentCampusId),
          financesService.getVouchers(currentCampusId)
        ]);
        setMembers(membersData);
        setVouchers(vouchersData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [currentCampusId]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 via-brand-700 to-brand-600 p-6 md:p-8 text-white shadow-theme-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 md:gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white p-1.5 shadow-theme-md shrink-0 flex items-center justify-center border border-white/20">
              <img
                src="/logo-hsc.jpg"
                alt="Logo HSC"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-brand-100 text-xs font-medium mb-2">
                {isGlobalScope ? (
                  <>
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Vue Réseau Mondial Consolidée · Apôtre Roland G. Elenga</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Campus {currentCampus?.name} · {currentCampus?.city}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Bienvenue, {currentUser ? `${currentUser.title || ""} ${currentUser.last_name || ""}`.trim() : "Cher Serviteur"}
              </h1>
            <p className="mt-1 text-sm text-brand-100/85 max-w-2xl leading-relaxed">
              {isGlobalScope
                ? "Supervision globale du réseau HSC : 5 implantations actives, consolidation des effectifs, flux de trésorerie et alertes spirituelles."
                : `Gestion opérationnelle locale : culte dominical, intendance des actifs, validation des pièces et pipeline d'assimilation des âmes.`}
            </p>
          </div>
        </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/members/new">
              <Button variant="outline" size="sm" className="bg-white/10 text-white ring-white/20 hover:bg-white/20 border-0">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Nouveau Membre
              </Button>
            </Link>
            <Link href="/ai/voice-to-action">
              <Button variant="default" size="sm" className="bg-white text-brand-900 hover:bg-brand-50 shadow-none font-semibold">
                <Mic className="w-4 h-4 mr-1.5 text-brand-600" />
                Note Vocale IA
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Primary KPI Grid (StatCards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          title={isGlobalScope ? "Membres Totaux Réseau" : "Membres du Campus"}
          value={isLoading ? "..." : members.length.toString()}
          change="+8.4%"
          trend="up"
          subtitle="Enregistrés et suivis"
          icon={<Users className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />

        <StatCard
          title="Nouveaux Venus"
          value={isLoading ? "..." : members.filter(m => m.status === 'NOUVEAU').length.toString()}
          change="Personnes à intégrer"
          trend="up"
          subtitle="Module d'accueil en cours"
          icon={<Church className="w-6 h-6 text-blue-light-500" />}
          iconBgColor="bg-blue-light-50 dark:bg-blue-light-500/15"
        />

        <StatCard
          title="Total Dépenses (Clôturées)"
          value={isLoading ? "..." : vouchers.filter(v => v.status === "DISBURSED").reduce((acc, v) => acc + v.amount, 0).toLocaleString('fr-FR') + " F"}
          change="Décaissements justifiés"
          trend="up"
          subtitle="Pièces de caisse clôturées"
          icon={<Wallet className="w-6 h-6 text-success-500" />}
          iconBgColor="bg-success-50 dark:bg-success-500/15"
        />

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

      {/* Mid Section: Global Multi-Site Comparison OR Campus Specific Actions */}
      {isGlobalScope ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table: Campus Overview */}
          <div className="lg:col-span-8">
            <ComponentCard
              title="Performance & Effectifs par Campus"
              desc="Répartition multi-sites du Siège Mondial et des extensions HSC"
              action={
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  5 sites connectés
                </span>
              }
            >
              <TableContainer>
                <TableHead>
                  <TableHeaderCell>Campus & Ville</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Pasteur Dirigeant</TableHeaderCell>
                  <TableHeaderCell>Effectif</TableHeaderCell>
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
                          color={c.campus_type === "HQ" ? "primary" : c.campus_type === "EXTENSION" ? "info" : "warning"}
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
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          -
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

          {/* Side Card: Focus Assimilation & Baptêmes */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
                  Pipeline d'Assimilation Réseau
                </h3>
                <Link href="/assimilation" className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
                  Voir Kanban <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="mt-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">1. Accueil (1ères visites)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{members.filter(m => m.assimilation_stage === 'ACCUEIL').length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">2. Module 1 (Affermissement)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{members.filter(m => m.assimilation_stage === 'MODULE_1').length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">3. Module 2 (Doctrine)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{members.filter(m => m.assimilation_stage === 'MODULE_2').length}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-light-50 dark:bg-blue-light-500/10 text-blue-light-700 dark:text-blue-light-400 font-semibold">
                  <span>4. Candidats au Baptême</span>
                  <span>{members.filter(m => m.assimilation_stage === 'BAPTEME').length} prêts</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 font-semibold">
                  <span>5. Intégration Départements</span>
                  <span>{members.filter(m => m.assimilation_stage === 'INTEGRE').length} affectés</span>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card>
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90 mb-3">
                Rapports & Audit
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
      ) : (
        /* Campus Local View */
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
                        Chargement des pièces...
                      </TableCell>
                    </TableRow>
                  ) : vouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        Aucune pièce de caisse récente
                      </TableCell>
                    </TableRow>
                  ) : (
                    vouchers.slice(0, 3).map((vch) => (
                      <TableRow key={vch.id}>
                        <TableCell>
                          <span className="font-mono text-xs font-bold text-gray-800 dark:text-white">{vch.voucher_number}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold block text-gray-900 dark:text-white">{vch.beneficiary}</span>
                          <span className="text-[11px] text-gray-400">{vch.purpose}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {Number(vch.amount).toLocaleString('fr-FR')} FCFA
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="light" 
                            color={vch.status === "APPROVED" ? "success" : vch.status === "DISBURSED" ? "success" : "warning"} 
                            size="sm"
                          >
                            {vch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{new Date(vch.created_at).toLocaleDateString('fr-FR')}</span>
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
                Actions Rapides Campus
              </h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <Link href="/members/new" className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group">
                  <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                    + Enregistrer un nouveau membre
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                </Link>
                <Link href="/assimilation" className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group">
                  <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                    Ouvrir le Kanban d'assimilation
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                </Link>
                <Link href="/ai/ocr-vision" className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 flex items-center justify-between transition-colors group">
                  <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-600">
                    Scan OCR Fiche de Présence
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
