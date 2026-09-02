"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { membersService } from "@/services/members.service";
import { Member } from "@/types/member.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  Eye,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function MembersPage() {
  const { currentCampusId } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [brigadeFilter, setBrigadeFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    membersService.getMembers(currentCampusId).then((data) => {
      setMembers(data);
      setIsLoading(false);
    });
  }, [currentCampusId]);

  const filteredMembers = members.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch =
      m.first_name.toLowerCase().includes(query) ||
      m.last_name.toLowerCase().includes(query) ||
      m.residential_area.toLowerCase().includes(query) ||
      m.phone.includes(query);

    const matchesBrigade =
      brigadeFilter === "all"
        ? true
        : brigadeFilter === "unassigned"
        ? m.brigade_id === null
        : m.brigade_id !== null;

    const matchesStage = stageFilter === "all" ? true : m.assimilation_stage === stageFilter;

    return matchesSearch && matchesBrigade && matchesStage;
  });

  const getStageBadge = (stage: Member["assimilation_stage"]) => {
    switch (stage) {
      case "ACCUEIL":
        return <Badge variant="light" color="warning" size="sm">1. Accueil</Badge>;
      case "MODULE_1":
        return <Badge variant="light" color="primary" size="sm">2. Module 1</Badge>;
      case "MODULE_2":
        return <Badge variant="light" color="info" size="sm">3. Module 2</Badge>;
      case "BAPTEME":
        return <Badge variant="light" color="primary" size="sm">4. Baptême</Badge>;
      case "INTEGRE":
        return <Badge variant="light" color="success" size="sm">5. Intégré</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annuaire des Membres & Fidèles"
        description="Gestion complète des fidèles, affectation aux brigades et suivi spirituel"
        breadcrumbs={[{ label: "Membres" }]}
        action={
          <Link href="/members/new">
            <Button variant="primary" size="md">
              <UserPlus className="w-4 h-4 mr-2" />
              Nouveau Membre
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, téléphone, quartier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Brigade Filter */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="font-semibold px-2 text-gray-700 dark:text-gray-300">Brigade :</span>
              <button
                onClick={() => setBrigadeFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  brigadeFilter === "all" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-brand-600 dark:text-white" : ""
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setBrigadeFilter("assigned")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  brigadeFilter === "assigned" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-brand-600 dark:text-white" : ""
                }`}
              >
                Affectés
              </button>
              <button
                onClick={() => setBrigadeFilter("unassigned")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  brigadeFilter === "unassigned" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-error-600 dark:text-error-400" : ""
                }`}
              >
                Non affectés
              </button>
            </div>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-10 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 shadow-theme-xs"
            >
              <option value="all">Toutes étapes d'assimilation</option>
              <option value="ACCUEIL">1. Accueil</option>
              <option value="MODULE_1">2. Module 1</option>
              <option value="MODULE_2">3. Module 2</option>
              <option value="BAPTEME">4. Candidat Baptême</option>
              <option value="INTEGRE">5. Intégré Département</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members DataTable */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Fidèle / Quartier</TableHeaderCell>
          <TableHeaderCell>Contacts</TableHeaderCell>
          <TableHeaderCell>Brigade de Rattachement</TableHeaderCell>
          <TableHeaderCell>Département</TableHeaderCell>
          <TableHeaderCell>Assimilation</TableHeaderCell>
          <TableHeaderCell>Baptême</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Chargement des fidèles...
              </TableCell>
            </TableRow>
          ) : filteredMembers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Aucun membre trouvé correspondant à ces filtres.
              </TableCell>
            </TableRow>
          ) : (
            filteredMembers.map((member) => (
              <TableRow key={member.id}>
                {/* Member Profile */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-brand-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={`${member.first_name} ${member.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-brand-600">
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/members/${member.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 block transition-colors"
                      >
                        {member.first_name} {member.last_name}
                      </Link>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {member.residential_area}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Contacts */}
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs">
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-300"
                    >
                      <Phone className="w-3 h-3 text-gray-400" />
                      {member.phone}
                    </a>
                    {member.whatsapp && (
                      <a
                        href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-success-600 hover:text-success-700 font-medium"
                      >
                        <MessageCircle className="w-3 h-3 text-success-500" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Brigade (OPTIONAL: shows explicit "Non affecté" badge if null) */}
                <TableCell>
                  {member.brigade_name ? (
                    <Badge variant="light" color="primary" size="sm">
                      {member.brigade_name}
                    </Badge>
                  ) : (
                    <Badge variant="light" color="light" size="sm" className="border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                      Non affecté
                    </Badge>
                  )}
                </TableCell>

                {/* Department */}
                <TableCell>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {member.department_name || "—"}
                  </span>
                </TableCell>

                {/* Assimilation */}
                <TableCell>
                  <div className="space-y-1">
                    {getStageBadge(member.assimilation_stage)}
                    <span className="block text-[10px] text-gray-400">
                      Progression : {member.assimilation_progress}
                    </span>
                  </div>
                </TableCell>

                {/* Baptism */}
                <TableCell>
                  {member.is_baptized ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-600 dark:text-success-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Baptisé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <XCircle className="w-3.5 h-3.5" />
                      Non baptisé
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <Link href={`/members/${member.id}`}>
                    <Button variant="outline" size="sm" className="h-8 px-3">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Détail
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>
    </div>
  );
}
