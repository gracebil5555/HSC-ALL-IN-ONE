"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { financesService } from "@/services/finances.service";
import { FinancialEntry } from "@/types/finance.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowDownRight, ArrowUpRight, Clock, FileSpreadsheet } from "lucide-react";

export default function FinancialJournalPage() {
  const { currentCampusId } = useTenant();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    financesService.getJournalEntries(currentCampusId).then((data) => {
      setEntries(data);
      setIsLoading(false);
    });
  }, [currentCampusId]);

  const totalCredits = entries
    .filter((e) => e.entry_type === "CREDIT")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalDebits = entries
    .filter((e) => e.entry_type === "DEBIT")
    .reduce((sum, e) => sum + e.amount, 0);

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
          ) : (
            entries.map((entry) => (
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
                      DÉBIT
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
                    {entry.amount.toLocaleString("fr-FR")} FCFA
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.registered_by}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {entry.created_at}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>
    </div>
  );
}
