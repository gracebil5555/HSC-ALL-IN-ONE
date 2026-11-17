"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Coins,
  Lock,
  Unlock,
  Plus,
  Edit2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { financesService } from "@/services/finances.service";
import {
  AccountingPeriodClose,
  CurrencyCode,
  ExchangeRate,
} from "@/types/finance.types";
import { ComponentCard } from "@/components/ui/Card";
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

const CURRENCIES: CurrencyCode[] = ["XAF", "CAD", "EUR", "USD"];
const MONTHS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
];

export default function FinanceGovernancePage() {
  const { campuses, currentCampusId, currentUser } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdminOrAbove,
    canViewFinances,
    hasPermission,
  } = useRole();

  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [periods, setPeriods] = useState<AccountingPeriodClose[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exchange Rate Modal
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("CAD");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("XAF");
  const [rateValue, setRateValue] = useState("445.000000");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [rateActive, setRateActive] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Period Close Modal
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const now = new Date();
  const [closeYear, setCloseYear] = useState(String(now.getFullYear()));
  const [closeMonth, setCloseMonth] = useState(String(now.getMonth() + 1));
  const [closeCampusId, setCloseCampusId] = useState<string>(
    currentCampusId && currentCampusId !== "all"
      ? currentCampusId
      : campuses[0]?.id
      ? String(campuses[0].id)
      : ""
  );
  const [closeNotes, setCloseNotes] = useState("");
  const [savingClose, setSavingClose] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const canAccess = canViewFinances;
  const canManageRates =
    isSuperSuperAdmin && (hasPermission("creer") || hasPermission("modifier"));
  const canClosePeriod = isSuperAdminOrAbove && hasPermission("valider");
  const canReopenPeriod = isSuperSuperAdmin;

  const fetchData = useCallback(async () => {
    if (!canAccess) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const [ratesData, periodsData] = await Promise.all([
        financesService.getExchangeRates(),
        financesService.getPeriodCloses(currentCampusId),
      ]);
      setRates(ratesData);
      setPeriods(periodsData);
    } catch {
      setErrorMsg("Impossible de charger les données de gouvernance financière.");
    } finally {
      setLoading(false);
    }
  }, [canAccess, currentCampusId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentCampusId && currentCampusId !== "all") {
      setCloseCampusId(currentCampusId);
    } else if (campuses.length > 0 && !closeCampusId) {
      setCloseCampusId(String(campuses[0].id));
    }
  }, [currentCampusId, campuses, closeCampusId]);

  const openCreateRateModal = () => {
    setEditingRate(null);
    setFromCurrency("CAD");
    setToCurrency("XAF");
    setRateValue("445.000000");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setRateActive(true);
    setRateError(null);
    setRateModalOpen(true);
  };

  const openEditRateModal = (r: ExchangeRate) => {
    setEditingRate(r);
    setFromCurrency(r.from_currency);
    setToCurrency(r.to_currency);
    setRateValue(String(r.rate));
    setEffectiveDate(r.effective_date);
    setRateActive(r.is_active);
    setRateError(null);
    setRateModalOpen(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateValue || Number(rateValue) <= 0) {
      setRateError("Le taux doit être strictement positif.");
      return;
    }
    setSavingRate(true);
    setRateError(null);
    try {
      if (editingRate) {
        await financesService.updateExchangeRate(editingRate.id, {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: rateValue,
          effective_date: effectiveDate,
          is_active: rateActive,
        });
      } else {
        await financesService.createExchangeRate({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: rateValue,
          effective_date: effectiveDate,
          is_active: rateActive,
        });
      }
      setRateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setRateError(
        err?.response?.data?.detail || "Erreur lors de l'enregistrement du taux de change."
      );
    } finally {
      setSavingRate(false);
    }
  };

  const handleClosePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClose(true);
    setCloseError(null);
    try {
      const payload: { campus?: number; year: number; month: number; notes?: string } = {
        year: Number(closeYear),
        month: Number(closeMonth),
        notes: closeNotes.trim(),
      };
      if (isSuperSuperAdmin && closeCampusId) {
        payload.campus = Number(closeCampusId);
      } else if (currentUser?.campus_id) {
        payload.campus = Number(currentUser.campus_id);
      }
      await financesService.closePeriod(payload);
      setCloseModalOpen(false);
      setCloseNotes("");
      await fetchData();
    } catch (err: any) {
      setCloseError(
        err?.response?.data?.detail || "Impossible de clôturer cette période comptable."
      );
    } finally {
      setSavingClose(false);
    }
  };

  const handleReopenPeriod = async (id: number) => {
    try {
      await financesService.reopenPeriod(id);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || "Impossible de rouvrir cette période comptable."
      );
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <EmptyState
          title="Accès restreint"
          description="La gouvernance financière est réservée aux administrateurs Finances et aux Super Admins."
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
            Taux de Change & Clôture Mensuelle
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consolidation multi-devises vers le Siège (XAF) et verrouillage des périodes comptables par campus.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchData}
          isLoading={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Exchange Rates */}
      <ComponentCard
        title="Taux de Change Multi-Devises"
        desc="Conversion officielle des devises locales (CAD, EUR, USD, XAF) vers la devise du Siège Mondial."
        action={
          canManageRates && (
            <Button variant="primary" size="sm" onClick={openCreateRateModal}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un taux
            </Button>
          )
        }
      >
        {loading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : rates.length === 0 ? (
          <EmptyState
            title="Aucun taux personnalisé"
            description="Les taux par défaut du système sont utilisés jusqu'à l'ajout d'un taux officiel."
            icon={<Coins className="w-6 h-6" />}
          />
        ) : (
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Paire</TableHeaderCell>
              <TableHeaderCell>Taux de conversion</TableHeaderCell>
              <TableHeaderCell>Date d&apos;effet</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Créé par</TableHeaderCell>
              {canManageRates && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
            </TableHead>
            <TableBody>
              {rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-gray-900 dark:text-white">
                    {r.from_currency} → {r.to_currency}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    1 {r.from_currency} = {r.rate} {r.to_currency}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(r.effective_date).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge color={r.is_active ? "success" : "light"} size="sm">
                      {r.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {r.created_by_name || "Système"}
                  </TableCell>
                  {canManageRates && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditRateModal(r)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Modifier
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </TableContainer>
        )}
      </ComponentCard>

      {/* Section 2: Monthly Accounting Period Closes */}
      <ComponentCard
        title="Clôtures Mensuelles de Caisse"
        desc="Une période clôturée bloque toute nouvelle écriture ou décaissement sur le campus concerné."
        action={
          canClosePeriod && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCloseError(null);
                setCloseModalOpen(true);
              }}
            >
              <Lock className="w-4 h-4 mr-1" />
              Clôturer un mois
            </Button>
          )
        }
      >
        {loading ? (
          <TableSkeleton rows={4} columns={5} />
        ) : periods.length === 0 ? (
          <EmptyState
            title="Aucune période clôturée"
            description="Tous les mois comptables sont actuellement ouverts pour les opérations de caisse."
            icon={<Lock className="w-6 h-6" />}
          />
        ) : (
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Campus</TableHeaderCell>
              <TableHeaderCell>Période</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Clôturée par</TableHeaderCell>
              <TableHeaderCell>Date de clôture</TableHeaderCell>
              <TableHeaderCell>Notes</TableHeaderCell>
              {canReopenPeriod && <TableHeaderCell className="text-right">Action</TableHeaderCell>}
            </TableHead>
            <TableBody>
              {periods.map((p) => {
                const monthLabel =
                  MONTHS.find((m) => m.value === p.month)?.label || String(p.month).padStart(2, "0");
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {p.campus_name || `Campus #${p.campus}`}
                    </TableCell>
                    <TableCell className="font-medium">
                      {monthLabel} {p.year}
                    </TableCell>
                    <TableCell>
                      <Badge color={p.is_closed ? "warning" : "success"} size="sm">
                        {p.is_closed ? "Clôturée" : "Ouverte"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 dark:text-gray-300">
                      {p.closed_by_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(p.closed_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-gray-500">
                      {p.notes || "—"}
                    </TableCell>
                    {canReopenPeriod && (
                      <TableCell className="text-right">
                        {p.is_closed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReopenPeriod(p.id)}
                          >
                            <Unlock className="w-3.5 h-3.5 mr-1" />
                            Rouvrir
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </TableContainer>
        )}
      </ComponentCard>

      {/* Exchange Rate Modal */}
      <Modal
        isOpen={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        title={editingRate ? "Modifier le taux de change" : "Nouveau taux de change"}
        description="Réservé au Super Super Admin (consolidation Siège Mondial)."
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          {rateError && (
            <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 p-3 text-xs text-error-700">
              {rateError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Devise source</Label>
              <Select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Devise cible</Label>
              <Select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Taux (1 {fromCurrency} = ? {toCurrency})</Label>
              <Input
                type="number"
                step="0.000001"
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                required
              />
            </div>
            <div>
              <Label required>Date d&apos;effet</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rateActive}
              onChange={(e) => setRateActive(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Taux actif</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setRateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={savingRate}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Period Modal */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Clôturer une période comptable"
        description="Verrouille les transactions et décaissements sur le mois sélectionné."
      >
        <form onSubmit={handleClosePeriod} className="space-y-4">
          {closeError && (
            <div className="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 p-3 text-xs text-error-700">
              {closeError}
            </div>
          )}

          {isSuperSuperAdmin && (
            <div>
              <Label required>Campus</Label>
              <Select
                value={closeCampusId}
                onChange={(e) => setCloseCampusId(e.target.value)}
                required
              >
                {campuses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} ({c.currency || "XAF"})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Mois</Label>
              <Select
                value={closeMonth}
                onChange={(e) => setCloseMonth(e.target.value)}
                required
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={String(m.value)}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label required>Année</Label>
              <Input
                type="number"
                min={2020}
                max={2100}
                value={closeYear}
                onChange={(e) => setCloseYear(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Notes de clôture</Label>
            <Textarea
              rows={2}
              placeholder="Ex: Caisse rapprochée et validée..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={() => setCloseModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={savingClose}>
              Verrouiller la période
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
