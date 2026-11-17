"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { membersService } from "@/services/members.service";
import { Member } from "@/types/member.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  PlusCircle,
} from "lucide-react";

interface ApiPastoralAlert {
  id: number;
  campus: number;
  member: number;
  member_name?: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  assigned_pastor?: number | null;
  assigned_pastor_name?: string | null;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string | null;
}

export default function AlertsPage() {
  const { currentCampusId, currentUser, campuses } = useTenant();
  const { hasPermission } = useRole();
  const [alerts, setAlerts] = useState<ApiPastoralAlert[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const resolvedCampusId =
    currentCampusId && currentCampusId !== "all"
      ? currentCampusId
      : String(currentUser?.campus_id || campuses[0]?.id || "1");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [alertsData, membersData] = await Promise.all([
      membersService.getAlerts(currentCampusId),
      membersService.getMembers(currentCampusId),
    ]);
    setAlerts(alertsData);
    setMembers(membersData);
    setIsLoading(false);
  }, [currentCampusId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = alerts.filter((a) =>
    statusFilter === "all" ? true : a.status === statusFilter
  );

  const getStatusBadge = (status: ApiPastoralAlert["status"]) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="light" color="error" size="sm">Ouvert</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="light" color="warning" size="sm">En cours</Badge>;
      case "RESOLVED":
        return <Badge variant="light" color="success" size="sm">Résolu</Badge>;
      default:
        return <Badge variant="light" color="light" size="sm">{status}</Badge>;
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !newTitle.trim() || !newDesc.trim()) return;
    setIsSubmitting(true);
    try {
      await membersService.createAlert({
        member: Number(selectedMemberId),
        title: newTitle.trim(),
        description: newDesc.trim(),
        campus: Number(resolvedCampusId),
      });
      setIsNewAlertOpen(false);
      setSelectedMemberId("");
      setNewTitle("");
      setNewDesc("");
      await loadData();
    } catch (err) {
      console.error("Erreur création alerte:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (alert: ApiPastoralAlert, nextStatus: "IN_PROGRESS" | "RESOLVED") => {
    try {
      const payload: Record<string, any> = { status: nextStatus };
      if (nextStatus === "IN_PROGRESS" && currentUser?.id) {
        payload.assigned_pastor = Number(currentUser.id);
      }
      if (nextStatus === "RESOLVED") {
        payload.resolved_at = new Date().toISOString();
      }
      await membersService.updateAlert(alert.id, payload);
      await loadData();
    } catch (err) {
      console.error("Erreur mise à jour alerte:", err);
    }
  };

  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const inProgressCount = alerts.filter((a) => a.status === "IN_PROGRESS").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertes Pastorales & Cas Sociaux"
        description="Suivi des urgences, visites pastorales, décrochages et accompagnement social"
        breadcrumbs={[{ label: "Alertes Pastorales" }]}
        action={
          hasPermission("creer") ? (
            <Button variant="default" size="default" onClick={() => setIsNewAlertOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nouvelle Alerte
            </Button>
          ) : undefined
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 block">Alertes Ouvertes</span>
            <span className="text-2xl font-bold text-error-600">{openCount}</span>
          </div>
          <ShieldAlert className="w-6 h-6 text-error-500" />
        </div>
        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 block">En Cours de Traitement</span>
            <span className="text-2xl font-bold text-warning-600">{inProgressCount}</span>
          </div>
          <Clock className="w-6 h-6 text-warning-500" />
        </div>
        <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 block">Résolues</span>
            <span className="text-2xl font-bold text-success-600">{resolvedCount}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-success-500" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "Toutes" },
          { key: "OPEN", label: "Ouvertes" },
          { key: "IN_PROGRESS", label: "En cours" },
          { key: "RESOLVED", label: "Résolues" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.key
                ? "bg-brand-600 text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Fidèle concerné</TableHeaderCell>
          <TableHeaderCell>Motif / Alerte</TableHeaderCell>
          <TableHeaderCell>Pasteur / Référent</TableHeaderCell>
          <TableHeaderCell>Statut</TableHeaderCell>
          <TableHeaderCell>Date</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                Chargement des alertes pastorales...
              </TableCell>
            </TableRow>
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                Aucune alerte pastorale dans ce périmètre.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {alert.member_name || `Membre #${alert.member}`}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 block">
                      {alert.title}
                    </span>
                    <span className="text-[11px] text-gray-500 line-clamp-2">
                      {alert.description}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {alert.assigned_pastor_name || "Non assigné"}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(alert.status)}</TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-400">
                    {new Date(alert.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {alert.status === "OPEN" && hasPermission("modifier") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(alert, "IN_PROGRESS")}
                      >
                        Prendre en charge
                      </Button>
                    )}
                    {alert.status !== "RESOLVED" && hasPermission("modifier") && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusChange(alert, "RESOLVED")}
                      >
                        Résoudre
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>

      {/* Modal Nouvelle Alerte */}
      <Modal
        isOpen={isNewAlertOpen}
        onClose={() => setIsNewAlertOpen(false)}
        title="Signaler une Alerte Pastorale"
        description="Notifier l'équipe pastorale d'une situation nécessitant un accompagnement"
      >
        <form onSubmit={handleCreateAlert} className="space-y-4">
          <div>
            <Label required>Fidèle concerné</Label>
            <Select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
            >
              <option value="">Sélectionner un membre</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Titre / Motif</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ex: Hospitalisation, Deuil, Absence prolongée..."
              required
            />
          </div>
          <div>
            <Label required>Description détaillée</Label>
            <Textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Précisez la situation et les actions urgentes souhaitées..."
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsNewAlertOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Créer l'alerte"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
