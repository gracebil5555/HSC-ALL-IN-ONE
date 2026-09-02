"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { financesService } from "@/services/finances.service";
import { CashVoucher, VoucherStatus } from "@/types/finance.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Banknote,
  Search,
  FileText,
  History,
  AlertCircle,
} from "lucide-react";

export default function VouchersPage() {
  const { currentCampusId, currentUser } = useTenant();
  const [vouchers, setVouchers] = useState<CashVoucher[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedVoucherForApproval, setSelectedVoucherForApproval] = useState<CashVoucher | null>(null);
  const [selectedVoucherForDisbursement, setSelectedVoucherForDisbursement] = useState<CashVoucher | null>(null);
  const [selectedVoucherForAudit, setSelectedVoucherForAudit] = useState<CashVoucher | null>(null);
  const [isNewVoucherModalOpen, setIsNewVoucherModalOpen] = useState(false);

  // Form states
  const [approvalNote, setApprovalNote] = useState("Dépense autorisée pour le service du culte.");
  const [disbursementNote, setDisbursementNote] = useState("Fonds remis en espèces contre signature.");
  const [newBeneficiary, setNewBeneficiary] = useState("");
  const [newDepartment, setNewDepartment] = useState("Chantres & Sono");
  const [newAmount, setNewAmount] = useState<number>(15000);
  const [newPurpose, setNewPurpose] = useState("");

  const loadVouchers = () => {
    setIsLoading(true);
    financesService.getVouchers(currentCampusId).then((data) => {
      setVouchers(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadVouchers();
  }, [currentCampusId]);

  const handleApprove = async () => {
    if (!selectedVoucherForApproval) return;
    await financesService.approveVoucher(
      selectedVoucherForApproval.id,
      `${currentUser.title} ${currentUser.last_name}`,
      approvalNote
    );
    setSelectedVoucherForApproval(null);
    loadVouchers();
  };

  const handleDisburse = async () => {
    if (!selectedVoucherForDisbursement) return;
    await financesService.disburseVoucher(
      selectedVoucherForDisbursement.id,
      `${currentUser.title} ${currentUser.last_name}`,
      disbursementNote
    );
    setSelectedVoucherForDisbursement(null);
    loadVouchers();
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    await financesService.createVoucher({
      beneficiary: newBeneficiary,
      department_name: newDepartment,
      amount: Number(newAmount),
      purpose: newPurpose,
      campus_id: currentCampusId === "all" ? "campus-mpita-hq" : currentCampusId,
      requested_by_name: `${currentUser.title} ${currentUser.last_name}`,
    });
    setIsNewVoucherModalOpen(false);
    setNewBeneficiary("");
    setNewPurpose("");
    loadVouchers();
  };

  const filtered = vouchers.filter((v) => {
    const matchesStatus = statusFilter === "all" ? true : v.status === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      v.voucher_number.toLowerCase().includes(query) ||
      v.beneficiary.toLowerCase().includes(query) ||
      v.purpose.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: VoucherStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="light" color="warning" size="sm">En attente (Pasteur)</Badge>;
      case "APPROVED":
        return <Badge variant="light" color="info" size="sm">Validé (Prêt à décaisser)</Badge>;
      case "DISBURSED":
        return <Badge variant="light" color="success" size="sm">Décaissé & Clôturé</Badge>;
    }
  };

  const pendingCount = vouchers.filter((v) => v.status === "PENDING").length;
  const approvedCount = vouchers.filter((v) => v.status === "APPROVED").length;
  const totalDisbursed = vouchers
    .filter((v) => v.status === "DISBURSED")
    .reduce((sum, v) => sum + v.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circuit des Pièces de Caisse"
        description="Workflow d'approbation et décaissement en 3 états (PENDING ➔ APPROVED ➔ DISBURSED) avec journal d'audit"
        breadcrumbs={[
          { label: "Finances" },
          { label: "Pièces de Caisse" },
        ]}
        action={
          <Button variant="primary" size="md" onClick={() => setIsNewVoucherModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouvelle Pièce de Caisse
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <StatCard
          title="Total Décaissé Clôturé"
          value={`${totalDisbursed.toLocaleString("fr-FR")} FCFA`}
          subtitle="Dépenses justifiées avec reçu"
          icon={<Banknote className="w-6 h-6 text-success-500" />}
          iconBgColor="bg-success-50 dark:bg-success-500/15"
        />

        <StatCard
          title="En Attente d'Approbation Pastorale"
          value={pendingCount}
          subtitle="Statut PENDING"
          trend="down"
          icon={<Clock className="w-6 h-6 text-warning-500" />}
          iconBgColor="bg-warning-50 dark:bg-warning-500/15"
        />

        <StatCard
          title="Validées à Décaisser"
          value={approvedCount}
          subtitle="Statut APPROVED (Trésorerie)"
          trend="up"
          icon={<ShieldCheck className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par N° de pièce, bénéficiaire, motif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === "all" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-brand-600 dark:text-white" : ""
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === "PENDING" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-warning-600 dark:text-warning-400" : ""
              }`}
            >
              En attente ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === "APPROVED" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-brand-600 dark:text-brand-400" : ""
              }`}
            >
              Validées ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter("DISBURSED")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === "DISBURSED" ? "bg-white dark:bg-gray-700 font-bold shadow-xs text-success-600 dark:text-success-400" : ""
              }`}
            >
              Décaissées
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers DataTable */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>N° Pièce</TableHeaderCell>
          <TableHeaderCell>Bénéficiaire & Département</TableHeaderCell>
          <TableHeaderCell>Motif de la Dépense</TableHeaderCell>
          <TableHeaderCell>Montant</TableHeaderCell>
          <TableHeaderCell>Statut Workflow</TableHeaderCell>
          <TableHeaderCell>Demandeur / Date</TableHeaderCell>
          <TableHeaderCell className="text-right">Action Workflow</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Chargement des pièces de caisse...
              </TableCell>
            </TableRow>
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Aucune pièce de caisse trouvée.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((vch) => (
              <TableRow key={vch.id}>
                {/* Voucher Number */}
                <TableCell>
                  <button
                    onClick={() => setSelectedVoucherForAudit(vch)}
                    className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    {vch.voucher_number}
                  </button>
                </TableCell>

                {/* Beneficiary */}
                <TableCell>
                  <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                    {vch.beneficiary}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {vch.department_name}
                  </span>
                </TableCell>

                {/* Purpose */}
                <TableCell>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xs line-clamp-2">
                    {vch.purpose}
                  </p>
                </TableCell>

                {/* Amount */}
                <TableCell>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {vch.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(vch.status)}</TableCell>

                {/* Requester */}
                <TableCell>
                  <span className="text-xs text-gray-700 dark:text-gray-300 block">
                    {vch.requested_by_name}
                  </span>
                  <span className="text-[10px] text-gray-400">{vch.created_at}</span>
                </TableCell>

                {/* Actions depending on workflow state */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {vch.status === "PENDING" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setSelectedVoucherForApproval(vch)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Valider
                      </Button>
                    )}

                    {vch.status === "APPROVED" && (
                      <Button
                        variant="success"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => setSelectedVoucherForDisbursement(vch)}
                      >
                        <Banknote className="w-3.5 h-3.5 mr-1" />
                        Décaisser
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      title="Historique d'audit"
                      onClick={() => setSelectedVoucherForAudit(vch)}
                    >
                      <History className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>

      {/* MODAL 1: Approval Pastoral Modal */}
      {selectedVoucherForApproval && (
        <Modal
          isOpen={Boolean(selectedVoucherForApproval)}
          onClose={() => setSelectedVoucherForApproval(null)}
          title={`Validation Pastorale — ${selectedVoucherForApproval.voucher_number}`}
          description="Autorisation officielle de la dépense par le Pasteur Principal ou Super-Admin"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Bénéficiaire :</span>
                <span className="font-bold text-gray-800 dark:text-white">{selectedVoucherForApproval.beneficiary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Montant requis :</span>
                <span className="font-bold text-brand-600 text-sm">{selectedVoucherForApproval.amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Motif :</span>
                <p className="text-gray-700 dark:text-gray-300 font-medium">{selectedVoucherForApproval.purpose}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="appNote">Note pastorale d'autorisation</Label>
              <Input
                id="appNote"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedVoucherForApproval(null)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleApprove}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Approuver la pièce
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Disbursement Modal */}
      {selectedVoucherForDisbursement && (
        <Modal
          isOpen={Boolean(selectedVoucherForDisbursement)}
          onClose={() => setSelectedVoucherForDisbursement(null)}
          title={`Décaissement des Fonds — ${selectedVoucherForDisbursement.voucher_number}`}
          description="Enregistrement de la sortie physique des espèces par le gestionnaire de caisse"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-success-800 dark:text-success-300">Montant à décaisser :</span>
                <span className="font-bold text-base text-success-700 dark:text-success-400">
                  {selectedVoucherForDisbursement.amount.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
              <p className="text-[11px] text-success-700 dark:text-success-400">
                Validé préalablement par {selectedVoucherForDisbursement.approved_by_name} le {selectedVoucherForDisbursement.approved_at}
              </p>
            </div>

            <div>
              <Label htmlFor="disbNote">Observations / Récépissé</Label>
              <Input
                id="disbNote"
                value={disbursementNote}
                onChange={(e) => setDisbursementNote(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-500">
              ℹ️ Cette action clôture définitivement la pièce et inscrit automatiquement un débit de <strong>{selectedVoucherForDisbursement.amount.toLocaleString("fr-FR")} FCFA</strong> dans le journal financier du campus.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedVoucherForDisbursement(null)}>
                Annuler
              </Button>
              <Button variant="success" size="sm" onClick={handleDisburse}>
                <Banknote className="w-4 h-4 mr-1" />
                Confirmer le décaissement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Audit Trail Modal */}
      {selectedVoucherForAudit && (
        <Modal
          isOpen={Boolean(selectedVoucherForAudit)}
          onClose={() => setSelectedVoucherForAudit(null)}
          title={`Journal d'Audit — ${selectedVoucherForAudit.voucher_number}`}
          description="Traçabilité complète des actions, horodatage et statuts"
        >
          <div className="space-y-4 text-xs">
            <div className="border-l-2 border-brand-500 pl-4 space-y-4 ml-2">
              {selectedVoucherForAudit.audit_trail.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {entry.action}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Effectué par : <strong>{entry.user_name}</strong>
                  </p>
                  {entry.note && (
                    <p className="text-gray-600 dark:text-gray-300 italic mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-[11px]">
                      "{entry.note}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedVoucherForAudit(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: New Voucher Creation Modal */}
      {isNewVoucherModalOpen && (
        <Modal
          isOpen={isNewVoucherModalOpen}
          onClose={() => setIsNewVoucherModalOpen(false)}
          title="Émettre une Nouvelle Pièce de Caisse"
          description="Demande prévisionnelle de fonds soumise à validation pastorale"
        >
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div>
              <Label htmlFor="beneficiary" required>
                Bénéficiaire / Prestataire
              </Label>
              <Input
                id="beneficiary"
                placeholder="Ex: Station Total, Chantres, Quincaillerie..."
                value={newBeneficiary}
                onChange={(e) => setNewBeneficiary(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dept" required>
                  Département
                </Label>
                <Select
                  id="dept"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                >
                  <option value="Chantres & Sono">Chantres & Sono</option>
                  <option value="Logistique & Énergie">Logistique & Énergie</option>
                  <option value="Protocole & Accueil">Protocole & Accueil</option>
                  <option value="Secrétariat & Direction">Secrétariat & Direction</option>
                  <option value="Diaconat & Social">Diaconat & Social</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount" required>
                  Montant (FCFA)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="500"
                  step="500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose" required>
                Motif détaillé de la dépense
              </Label>
              <Input
                id="purpose"
                placeholder="Ex: Achat carburant pour groupe électrogène culte..."
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => setIsNewVoucherModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Soumettre à validation (PENDING)
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
