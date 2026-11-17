"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { financesService } from "@/services/finances.service";
import { FinancialEntry } from "@/types/finance.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArrowDownRight, ArrowUpRight, Clock, Download, PlusCircle } from "lucide-react";

export default function FinancialJournalPage() {
  const { currentCampusId, currentUser, campuses } = useTenant();
  const { canManageFinances, hasPermission } = useRole();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres par période et type
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState("ALL");

  // Modal saisie recette / dépense directe
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    entry_type: "CREDIT" as "CREDIT" | "DEBIT",
    category: "DIMES",
    amount: "",
    reference: "",
    description: "",
  });

  const resolvedCampusId =
    currentCampusId && currentCampusId !== "all"
      ? currentCampusId
      : String(currentUser?.campus_id || campuses[0]?.id || "1");

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    const data = await financesService.getJournalEntries(currentCampusId, {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      entry_type: entryTypeFilter,
    });
    setEntries(data);
    setIsLoading(false);
  }, [currentCampusId, dateFrom, dateTo, entryTypeFilter]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(form.amount);
    if (!numericAmount || numericAmount <= 0 || !form.description.trim()) return;
    setIsSubmitting(true);
    try {
      await financesService.createTransaction({
        entry_type: form.entry_type,
        category: form.category,
        amount: numericAmount,
        reference: form.reference.trim(),
        description: form.description.trim(),
        campus: Number(resolvedCampusId),
      });
      setIsModalOpen(false);
      setForm({
        entry_type: "CREDIT",
        category: "DIMES",
        amount: "",
        reference: "",
        description: "",
      });
      await loadEntries();
    } catch (err) {
      console.error("Erreur création écriture:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ["Reference", "Type", "Categorie", "Description", "Montant", "Enregistre_par", "Date"];
    const rows = entries.map((e: any) => [
      e.reference || "",
      e.entry_type || "",
      e.category || "",
      `"${(e.description || "").replace(/"/g, '""')}"`,
      Number(e.amount || 0),
      `"${(e.registered_by_name || e.recorded_by_name || "").replace(/"/g, '""')}"`,
      e.created_at || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `journal-financier-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalCredits = entries
    .filter((e) => e.entry_type === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalDebits = entries
    .filter((e) => e.entry_type === "DEBIT")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const netBalance = totalCredits - totalDebits;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grand Livre & Journal Financier"
        description="Traçabilité inaltérable des entrées de dîmes/offrandes et sorties de pièces de caisse"
        breadcrumbs={[
          { label: "Finances", href: "/finances/vouchers" },
          { label: "Journal Financier" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={entries.length === 0}>
              <Download className="w-4 h-4 mr-1.5" />
              Exporter CSV
            </Button>
            {canManageFinances && hasPermission("creer") && (
              <Button variant="default" size="sm" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Nouvelle Écriture
              </Button>
            )}
          </div>
        }
      />

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 block">Total Entrées (Collectes)</span>
          <span className="text-xl font-bold text-success-600 block mt-1">
            +{totalCredits.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 block">Total Sorties (Décaissements)</span>
          <span className="text-xl font-bold text-error-600 block mt-1">
            -{totalDebits.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
        <div className="p-5 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <span className="text-xs text-gray-500 block">Solde Net de Caisse</span>
          <span className="text-xl font-bold text-brand-600 block mt-1">
            {netBalance.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      </div>

      {/* Filtres par Période & Type */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-[11px]">Du</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Au</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-xs" />
        </div>
        <div>
          <Label className="text-[11px]">Type d'écriture</Label>
          <Select
            value={entryTypeFilter}
            onChange={(e) => setEntryTypeFilter(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="ALL">Toutes les écritures</option>
            <option value="CREDIT">Entrées (CREDIT)</option>
            <option value="DEBIT">Sorties (DEBIT)</option>
          </Select>
        </div>
        {(dateFrom || dateTo || entryTypeFilter !== "ALL") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setEntryTypeFilter("ALL");
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Journal Table */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Référence Écriture</TableHeaderCell>
          <TableHeaderCell>Nature & Type</TableHeaderCell>
          <TableHeaderCell>Description / Libellé</TableHeaderCell>
          <TableHeaderCell>Montant</TableHeaderCell>
          <TableHeaderCell>Enregistré par</TableHeaderCell>
          <TableHeaderCell>Date & Heure</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                Chargement du journal financier...
              </TableCell>
            </TableRow>
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                Aucune écriture comptable sur cette période.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-white">
                    {entry.reference}
                  </span>
                </TableCell>
                <TableCell>
                  {entry.entry_type === "CREDIT" ? (
                    <Badge variant="light" color="success" size="sm">
                      <ArrowUpRight className="w-3 h-3" />
                      CRÉDIT ({entry.category})
                    </Badge>
                  ) : (
                    <Badge variant="light" color="error" size="sm">
                      <ArrowDownRight className="w-3 h-3" />
                      DÉBIT ({entry.category})
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">
                    {entry.description}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs font-bold ${
                      entry.entry_type === "CREDIT" ? "text-success-600" : "text-error-600"
                    }`}
                  >
                    {entry.entry_type === "CREDIT" ? "+" : "-"}
                    {Number(entry.amount || 0).toLocaleString("fr-FR")} FCFA
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.registered_by_name || entry.recorded_by_name || "Trésorerie"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.created_at ? new Date(entry.created_at).toLocaleString("fr-FR") : ""}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>

      {/* Modal Nouvelle Écriture (Recette CREDIT / Dépense directe DEBIT) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer une Écriture Financière"
        description="Les écritures passées sont immuables et mettent automatiquement à jour le solde de caisse"
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Sens de l'écriture</Label>
              <Select
                value={form.entry_type}
                onChange={(e) => {
                  const type = e.target.value as "CREDIT" | "DEBIT";
                  setForm({
                    ...form,
                    entry_type: type,
                    category: type === "CREDIT" ? "DIMES" : "CHARGES_DIRECTES",
                  });
                }}
              >
                <option value="CREDIT">Recette / Entrée (+)</option>
                <option value="DEBIT">Dépense directe / Sortie (-)</option>
              </Select>
            </div>
            <div>
              <Label required>Catégorie</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {form.entry_type === "CREDIT" ? (
                  <>
                    <option value="DIMES">Dîmes</option>
                    <option value="OFFRANDES">Offrandes</option>
                    <option value="DONS">Dons & Libéralités</option>
                    <option value="AUTRE_RECETTE">Autre Recette</option>
                  </>
                ) : (
                  <>
                    <option value="CHARGES_DIRECTES">Charges Directes</option>
                    <option value="SOCIAL">Action Sociale</option>
                    <option value="LOGISTIQUE">Logistique</option>
                    <option value="AUTRE_DEPENSE">Autre Dépense</option>
                  </>
                )}
              </Select>
            </div>
            <div>
              <Label required>Montant (FCFA)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Ex: 250000"
                required
              />
            </div>
            <div>
              <Label>Référence (optionnelle)</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Auto si vide (ECR-...)"
              />
            </div>
            <div className="sm:col-span-2">
              <Label required>Libellé / Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Collecte du Culte Dominical 1er service"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Valider l'écriture"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
