"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Search,
  Eye,
  ShieldCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { auditService } from "@/services/audit.service";
import { SystemAuditLog } from "@/types/audit.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";

const ACTION_BADGE_MAP: Record<string, "primary" | "success" | "warning" | "error" | "info"> = {
  MEMBER_TRANSFER_REQUESTED: "info",
  MEMBER_TRANSFER_APPROVED: "success",
  MEMBER_TRANSFER_REJECTED: "error",
  EXCHANGE_RATE_CREATED: "primary",
  FINANCE_PERIOD_CLOSED: "warning",
  FINANCE_PERIOD_REOPENED: "info",
  FINANCE_TRANSACTION_CREATED: "primary",
  FINANCE_VOUCHER_APPROVED: "success",
  FINANCE_VOUCHER_DISBURSED: "success",
  FINANCE_VOUCHER_DELETED: "error",
};

export default function AuditLogsPage() {
  const { campuses, currentCampusId } = useTenant();
  const { isSuperSuperAdmin, isSuperAdminOrAbove, hasPermission } = useRole();

  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [campusFilter, setCampusFilter] = useState<string>(currentCampusId || "all");

  const [selectedLog, setSelectedLog] = useState<SystemAuditLog | null>(null);

  const canAccess = isSuperAdminOrAbove && hasPermission("voir");

  useEffect(() => {
    setCampusFilter(currentCampusId || "all");
  }, [currentCampusId]);

  const fetchLogs = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await auditService.getAuditLogs({
        campus_id: isSuperSuperAdmin ? campusFilter : currentCampusId,
        action: actionFilter,
        target_model: resourceFilter,
        search: searchTerm,
      });
      setLogs(data);
    } catch {
      setErrorMsg("Impossible de charger le journal d'audit.");
    } finally {
      setLoading(false);
    }
  }, [canAccess, isSuperSuperAdmin, campusFilter, currentCampusId, actionFilter, resourceFilter, searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueResources = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.target_model) set.add(l.target_model);
    });
    return Array.from(set).sort();
  }, [logs]);

  if (!canAccess) {
    return (
      <div className="p-6">
        <EmptyState
          title="Accès restreint"
          description="Le journal d'audit immuable est réservé aux Super Admins d'Église et au Super Super Admin."
          icon={<ShieldCheck className="w-6 h-6" />}
        />
      </div>
    );
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Journal d&apos;Audit Immuable
            </h1>
            <Badge color="primary" size="sm">
              Append-Only
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Traçabilité horodatée et infalsifiable des opérations critiques (finances, transferts, clôtures, délégations).
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchLogs}
          isLoading={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Rechercher acteur, description, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filtrer par action"
          >
            <option value="ALL">Toutes les actions</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </Select>

          <Select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            aria-label="Filtrer par type de ressource"
          >
            <option value="ALL">Toutes les ressources</option>
            {uniqueResources.map((res) => (
              <option key={res} value={res}>
                {res}
              </option>
            ))}
          </Select>

          {isSuperSuperAdmin ? (
            <Select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              aria-label="Filtrer par campus"
            >
              <option value="all">Tous les campus (Réseau)</option>
              {campuses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] text-xs text-gray-500">
              <Filter className="w-4 h-4 shrink-0" />
              <span>Périmètre limité à votre Église</span>
            </div>
          )}
        </div>
      </Card>

      {/* Content */}
      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Aucun événement d'audit trouvé"
          description="Aucun enregistrement ne correspond aux filtres sélectionnés."
          icon={<FileText className="w-6 h-6" />}
          action={
            (actionFilter !== "ALL" || resourceFilter !== "ALL" || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setActionFilter("ALL");
                  setResourceFilter("ALL");
                  setSearchTerm("");
                }}
              >
                Réinitialiser les filtres
              </Button>
            )
          }
        />
      ) : (
        <TableContainer>
          <TableHead>
            <TableHeaderCell>Date & Heure</TableHeaderCell>
            <TableHeaderCell>Acteur</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
            <TableHeaderCell>Ressource</TableHeaderCell>
            <TableHeaderCell>Campus</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell className="text-right">Détail</TableHeaderCell>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(log.created_at)}
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {log.actor_name || log.actor_username || "Système"}
                </TableCell>
                <TableCell>
                  <Badge color={ACTION_BADGE_MAP[log.action] || "light"} size="sm">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-gray-600 dark:text-gray-300">
                  {log.target_model}
                  {log.target_id ? ` #${log.target_id}` : ""}
                </TableCell>
                <TableCell className="text-xs">
                  {log.campus_name || "Réseau Global"}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-gray-600 dark:text-gray-400">
                  {log.description || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    aria-label="Voir le détail"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Aperçu
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContainer>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Événement d'Audit #${selectedLog?.id ?? ""}`}
        description={selectedLog ? `${selectedLog.action} • ${formatDateTime(selectedLog.created_at)}` : undefined}
        maxWidth="xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedLog(null)}>
            Fermer
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-400">Acteur</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedLog.actor_name} ({selectedLog.actor_username || "system"})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Campus</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedLog.campus_name || "Réseau Global"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ressource cible</p>
                <p className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {selectedLog.target_model} #{selectedLog.target_id || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Adresse IP</p>
                <p className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {selectedLog.ip_address || "Non enregistrée"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Description
              </p>
              <p className="p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                {selectedLog.description || "Aucune description"}
              </p>
            </div>

            {(selectedLog.metadata?.before_snapshot !== undefined ||
              selectedLog.metadata?.after_snapshot !== undefined) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Avant (before_snapshot)
                  </p>
                  <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata?.before_snapshot ?? null, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Après (after_snapshot)
                  </p>
                  <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata?.after_snapshot ?? null, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Métadonnées complètes
              </p>
              <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs overflow-x-auto max-h-52">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
