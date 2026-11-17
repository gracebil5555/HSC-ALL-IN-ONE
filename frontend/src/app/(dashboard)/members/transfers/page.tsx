"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { membersService } from "@/services/members.service";
import { Member, MemberTransferRequest, MemberTransferStatus } from "@/types/member.types";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
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

const STATUS_CONFIG: Record<
  MemberTransferStatus,
  { label: string; color: "warning" | "success" | "error" | "light" }
> = {
  PENDING: { label: "En attente", color: "warning" },
  APPROVED: { label: "Approuvé", color: "success" },
  REJECTED: { label: "Rejeté", color: "error" },
  CANCELLED: { label: "Annulé", color: "light" },
};

export default function MemberTransfersPage() {
  const { campuses, currentCampusId, currentUser } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdminOrAbove,
    isAccueilSocialSecDept,
    canManageMembers,
    hasPermission,
  } = useRole();

  const [transfers, setTransfers] = useState<MemberTransferRequest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ALL" | "INCOMING" | "OUTGOING" | "PENDING">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [toCampusId, setToCampusId] = useState("");
  const [reason, setReason] = useState("");
  const [preserveAssimilation, setPreserveAssimilation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Review modal state (approve / reject)
  const [reviewAction, setReviewAction] = useState<{
    transfer: MemberTransferRequest;
    type: "approve" | "reject";
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const canAccess = (isSuperAdminOrAbove || isAccueilSocialSecDept) && hasPermission("voir");
  const canApproveOrReject = isSuperAdminOrAbove && hasPermission("valider");
  const effectiveCampusId = isSuperSuperAdmin
    ? currentCampusId !== "all"
      ? Number(currentCampusId)
      : null
    : currentUser?.campus_id
    ? Number(currentUser.campus_id)
    : null;

  const fetchData = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const [transferList, memberList] = await Promise.all([
        membersService.getTransfers(currentCampusId),
        membersService.getMembers(currentCampusId),
      ]);
      setTransfers(transferList);
      setMembers(memberList);
    } catch {
      setErrorMsg("Impossible de charger les demandes de transfert.");
    } finally {
      setLoading(false);
    }
  }, [canAccess, currentCampusId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedMember = useMemo(
    () => members.find((m) => String(m.id) === String(selectedMemberId)) || null,
    [members, selectedMemberId]
  );

  const availableTargetCampuses = useMemo(() => {
    if (!selectedMember) return campuses;
    const memberCampusId = selectedMember.campus ?? Number(selectedMember.campus_id);
    return campuses.filter((c) => Number(c.id) !== Number(memberCampusId));
  }, [campuses, selectedMember]);

  const stats = useMemo(() => {
    const pending = transfers.filter((t) => t.status === "PENDING").length;
    const approved = transfers.filter((t) => t.status === "APPROVED").length;
    const incoming = effectiveCampusId
      ? transfers.filter((t) => t.to_campus === effectiveCampusId).length
      : transfers.length;
    const outgoing = effectiveCampusId
      ? transfers.filter((t) => t.from_campus === effectiveCampusId).length
      : 0;
    return { pending, approved, incoming, outgoing };
  }, [transfers, effectiveCampusId]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (activeTab === "PENDING" && t.status !== "PENDING") return false;
      if (activeTab === "INCOMING" && effectiveCampusId && t.to_campus !== effectiveCampusId) {
        return false;
      }
      if (activeTab === "OUTGOING" && effectiveCampusId && t.from_campus !== effectiveCampusId) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (t.member_name || "").toLowerCase().includes(q) ||
          (t.from_campus_name || "").toLowerCase().includes(q) ||
          (t.to_campus_name || "").toLowerCase().includes(q) ||
          (t.reason || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [transfers, activeTab, effectiveCampusId, searchTerm]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !toCampusId) {
      setFormError("Veuillez sélectionner un membre et un campus de destination.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await membersService.createTransfer({
        member: Number(selectedMemberId),
        to_campus: Number(toCampusId),
        reason: reason.trim(),
        preserve_assimilation: preserveAssimilation,
      });
      setIsCreateOpen(false);
      setSelectedMemberId("");
      setToCampusId("");
      setReason("");
      setPreserveAssimilation(true);
      await fetchData();
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.to_campus?.[0] ||
        "Erreur lors de la création de la demande de transfert.";
      setFormError(String(detail));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewAction) return;
    setReviewing(true);
    try {
      if (reviewAction.type === "approve") {
        await membersService.approveTransfer(reviewAction.transfer.id, reviewNotes);
      } else {
        await membersService.rejectTransfer(reviewAction.transfer.id, reviewNotes);
      }
      setReviewAction(null);
      setReviewNotes("");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Impossible de traiter cette demande de transfert."
      );
      setReviewAction(null);
    } finally {
      setReviewing(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <EmptyState
          title="Accès restreint"
          description="Vous n'avez pas l'autorisation d'accéder aux transferts inter-églises des membres."
          icon={<ShieldCheck className="w-6 h-6" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Transferts Inter-Églises
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mobilité des fidèles entre campus avec préservation du parcours d&apos;assimilation et lettre de recommandation.
          </p>
        </div>

        {canManageMembers && (
          <Button
            variant="primary"
            onClick={() => {
              setFormError(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Initier un transfert
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="En attente"
          value={stats.pending}
          subtitle="Validation requise"
          icon={<Clock className="w-5 h-5 text-warning-600" />}
          iconBgColor="bg-warning-50 dark:bg-warning-500/10"
        />
        <StatCard
          title="Transferts entrants"
          value={stats.incoming}
          subtitle={effectiveCampusId ? "Vers votre campus" : "Total réseau"}
          icon={<ArrowDownLeft className="w-5 h-5 text-blue-light-600" />}
          iconBgColor="bg-blue-light-50 dark:bg-blue-light-500/10"
        />
        <StatCard
          title="Transferts sortants"
          value={stats.outgoing}
          subtitle={effectiveCampusId ? "Depuis votre campus" : "Vue globale"}
          icon={<ArrowUpRight className="w-5 h-5 text-brand-600" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/10"
        />
        <StatCard
          title="Transferts approuvés"
          value={stats.approved}
          subtitle="Complétés avec succès"
          icon={<CheckCircle2 className="w-5 h-5 text-success-600" />}
          iconBgColor="bg-success-50 dark:bg-success-500/10"
        />
      </div>

      {/* Filters & Tabs */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "ALL", label: "Tous" },
                { key: "PENDING", label: "En attente" },
                { key: "INCOMING", label: "Entrants" },
                { key: "OUTGOING", label: "Sortants" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Rechercher un membre, campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filteredTransfers.length === 0 ? (
        <EmptyState
          title="Aucune demande de transfert"
          description="Aucun transfert inter-églises ne correspond à vos critères actuels."
          icon={<ArrowLeftRight className="w-6 h-6" />}
        />
      ) : (
        <TableContainer>
          <TableHead>
            <TableHeaderCell>Membre</TableHeaderCell>
            <TableHeaderCell>Origine → Destination</TableHeaderCell>
            <TableHeaderCell>Motif / Recommandation</TableHeaderCell>
            <TableHeaderCell>Assimilation</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableHead>
          <TableBody>
            {filteredTransfers.map((t) => {
              const statusMeta = STATUS_CONFIG[t.status] || { label: t.status, color: "light" as const };
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-semibold text-gray-900 dark:text-white">
                    {t.member_name || `Membre #${t.member}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {t.from_campus_name || `Campus #${t.from_campus}`}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        {t.to_campus_name || `Campus #${t.to_campus}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-gray-500 dark:text-gray-400">
                    {t.reason || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge color={t.preserve_assimilation ? "info" : "light"} size="sm">
                      {t.preserve_assimilation ? "Conservée" : "Réinitialisée"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge color={statusMeta.color} size="sm">
                      {statusMeta.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.status === "PENDING" && canApproveOrReject ? (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setReviewNotes("");
                            setReviewAction({ transfer: t, type: "approve" });
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setReviewNotes("");
                            setReviewAction({ transfer: t, type: "reject" });
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {t.reviewed_by_name ? `Par ${t.reviewed_by_name}` : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableContainer>
      )}

      {/* Create Transfer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle demande de transfert inter-églises"
        description="Initiez le transfert d'un fidèle vers une autre extension HSC."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30 p-3 text-xs text-error-700 dark:text-error-300">
              {formError}
            </div>
          )}

          <div>
            <Label required>Membre à transférer</Label>
            <Select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
                setToCampusId("");
              }}
              required
            >
              <option value="">Sélectionner un fidèle...</option>
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.first_name} {m.last_name} ({m.campus_name || "Campus local"})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Église / Campus de destination</Label>
            <Select
              value={toCampusId}
              onChange={(e) => setToCampusId(e.target.value)}
              required
              disabled={!selectedMemberId}
            >
              <option value="">Sélectionner le campus d&apos;accueil...</option>
              {availableTargetCampuses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} ({c.city}, {c.country})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Lettre de recommandation / Motif du transfert</Label>
            <Textarea
              rows={3}
              placeholder="Ex: Déménagement professionnel, recommandation pastorale..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={preserveAssimilation}
              onChange={(e) => setPreserveAssimilation(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Conserver l&apos;historique spirituel et l&apos;étape d&apos;assimilation</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Soumettre la demande
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve / Reject Modal */}
      <Modal
        isOpen={Boolean(reviewAction)}
        onClose={() => setReviewAction(null)}
        title={
          reviewAction?.type === "approve"
            ? "Approuver le transfert"
            : "Rejeter la demande de transfert"
        }
        description={
          reviewAction
            ? `${reviewAction.transfer.member_name || "Membre"} : ${reviewAction.transfer.from_campus_name} → ${reviewAction.transfer.to_campus_name}`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewAction(null)}>
              Annuler
            </Button>
            <Button
              variant={reviewAction?.type === "approve" ? "success" : "destructive"}
              onClick={handleConfirmReview}
              isLoading={reviewing}
            >
              {reviewAction?.type === "approve"
                ? "Confirmer le transfert"
                : "Confirmer le rejet"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {reviewAction?.type === "approve"
              ? "L'approbation transférera immédiatement la fiche du membre vers le campus de destination tout en conservant son parcours d'assimilation."
              : "La demande sera marquée comme rejetée et le membre restera rattaché à son campus d'origine."}
          </p>
          <div>
            <Label>Note de validation (optionnelle)</Label>
            <Textarea
              rows={2}
              placeholder="Commentaire pastoral ou administratif..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
