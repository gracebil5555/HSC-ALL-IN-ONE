"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import { patrimoineService } from "@/services/patrimoine.service";
import { departmentsService, DepartmentItem } from "@/services/departments.service";
import { Asset, AssetCondition, AssetMovement } from "@/types/patrimoine.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  TrendingDown,
  QrCode,
  Search,
  PlusCircle,
  MapPin,
  Edit,
  History,
  ArrowRightLeft,
} from "lucide-react";

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: "NEW", label: "Neuf" },
  { value: "GOOD", label: "Bon état" },
  { value: "FAIR", label: "État moyen" },
  { value: "MAINTENANCE", label: "En réparation" },
  { value: "DAMAGED", label: "Endommagé" },
  { value: "BROKEN", label: "Hors service" },
  { value: "LOST", label: "Perdu / Volé" },
];

export default function AssetsPage() {
  const { currentCampusId, currentUser, campuses } = useTenant();
  const { canManagePatrimoine, hasPermission, isSuperSuperAdmin } = useRole();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<Asset | null>(null);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<Asset | null>(null);
  const [assetMovements, setAssetMovements] = useState<AssetMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Création / Édition d'Actif
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    asset_code: "",
    category: "Équipement",
    department: "",
    location: "",
    purchase_date: "",
    purchase_price: "",
    useful_life_years: "5",
    depreciation_rate: "",
    condition: "GOOD" as AssetCondition,
    description: "",
  });

  // Modal Mouvement / Contrôle
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementAsset, setMovementAsset] = useState<Asset | null>(null);
  const [movementForm, setMovementForm] = useState({
    movement_type: "INSPECTION",
    from_location: "",
    to_location: "",
    observed_condition: "GOOD" as AssetCondition,
    movement_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const resolvedCampusId =
    currentCampusId && currentCampusId !== "all"
      ? currentCampusId
      : String(currentUser?.campus_id || campuses[0]?.id || "1");

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    const data = await patrimoineService.getAssets(currentCampusId);
    setAssets(data);
    setIsLoading(false);
  }, [currentCampusId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    if (resolvedCampusId) {
      departmentsService.getDepartments(resolvedCampusId).then(setDepartments);
    }
  }, [resolvedCampusId]);

  const openCreateModal = () => {
    setEditingAsset(null);
    setAssetForm({
      name: "",
      asset_code: "",
      category: "Équipement",
      department: "",
      location: "",
      purchase_date: new Date().toISOString().slice(0, 10),
      purchase_price: "",
      useful_life_years: "5",
      depreciation_rate: "",
      condition: "GOOD",
      description: "",
    });
    setIsAssetModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name || "",
      asset_code: asset.asset_code || "",
      category: asset.category || "Équipement",
      department: asset.department ? String(asset.department) : "",
      location: asset.location || asset.room || "",
      purchase_date: asset.purchase_date || "",
      purchase_price: asset.purchase_price !== null && asset.purchase_price !== undefined ? String(asset.purchase_price) : "",
      useful_life_years: asset.useful_life_years ? String(asset.useful_life_years) : "5",
      depreciation_rate: asset.depreciation_rate ? String(asset.depreciation_rate) : "",
      condition: asset.condition || "GOOD",
      description: asset.description || asset.notes || "",
    });
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: assetForm.name.trim(),
        asset_code: assetForm.asset_code.trim(),
        category: assetForm.category.trim() || "Général",
        department: assetForm.department ? Number(assetForm.department) : null,
        location: assetForm.location.trim(),
        purchase_date: assetForm.purchase_date || null,
        purchase_price: assetForm.purchase_price ? Number(assetForm.purchase_price) : null,
        useful_life_years: assetForm.useful_life_years ? Number(assetForm.useful_life_years) : 5,
        depreciation_rate: assetForm.depreciation_rate ? Number(assetForm.depreciation_rate) : null,
        condition: assetForm.condition,
        description: assetForm.description.trim(),
      };
      if (isSuperSuperAdmin || !editingAsset) {
        payload.campus = Number(resolvedCampusId);
      }

      if (editingAsset) {
        await patrimoineService.updateAsset(editingAsset.id, payload);
      } else {
        await patrimoineService.createAsset(payload);
      }
      setIsAssetModalOpen(false);
      await loadAssets();
    } catch (err) {
      console.error("Erreur enregistrement actif:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMovementModal = (asset: Asset) => {
    setMovementAsset(asset);
    setMovementForm({
      movement_type: "INSPECTION",
      from_location: asset.location || asset.room || "",
      to_location: asset.location || asset.room || "",
      observed_condition: asset.condition || "GOOD",
      movement_date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setIsMovementModalOpen(true);
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementAsset) return;
    setIsSubmitting(true);
    try {
      await patrimoineService.createAssetMovement({
        asset: Number(movementAsset.id),
        movement_type: movementForm.movement_type,
        from_location: movementForm.from_location,
        to_location: movementForm.to_location,
        observed_condition: movementForm.observed_condition,
        movement_date: movementForm.movement_date,
        notes: movementForm.notes,
      });
      setIsMovementModalOpen(false);
      await loadAssets();
    } catch (err) {
      console.error("Erreur création mouvement:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryModal = async (asset: Asset) => {
    setSelectedAssetForHistory(asset);
    const mvts = await patrimoineService.getAssetMovements(asset.id);
    setAssetMovements(mvts.length > 0 ? mvts : asset.movements || []);
  };

  const filteredAssets = assets.filter((a) => {
    const query = search.toLowerCase();
    const matchesSearch =
      (a.name || "").toLowerCase().includes(query) ||
      (a.asset_code || "").toLowerCase().includes(query) ||
      (a.room || "").toLowerCase().includes(query) ||
      (a.location || "").toLowerCase().includes(query) ||
      (a.department_name || "").toLowerCase().includes(query);

    const matchesCondition =
      conditionFilter === "all" ? true : a.condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const getConditionBadge = (condition: AssetCondition | string) => {
    switch (condition) {
      case "NEW":
        return <Badge variant="light" color="success" size="sm">Neuf</Badge>;
      case "GOOD":
        return <Badge variant="light" color="info" size="sm">Bon état</Badge>;
      case "FAIR":
        return <Badge variant="light" color="info" size="sm">État moyen</Badge>;
      case "MAINTENANCE":
        return <Badge variant="light" color="warning" size="sm">En réparation</Badge>;
      case "DAMAGED":
      case "BROKEN":
        return <Badge variant="light" color="error" size="sm">Hors service</Badge>;
      case "LOST":
        return <Badge variant="light" color="error" size="sm">Perdu / Volé</Badge>;
      default:
        return <Badge variant="light" color="light" size="sm">{condition || "Non défini"}</Badge>;
    }
  };

  const totalGrossValue = assets.reduce((sum, a) => sum + Number(a.purchase_price || a.estimated_value || 0), 0);
  const totalDepreciation = assets.reduce((sum, a) => sum + Number(a.accumulated_depreciation || 0), 0);
  const totalNetBookValue = assets.reduce((sum, a) => sum + Number(a.net_book_value ?? a.estimated_value ?? 0), 0);
  const operationalCount = assets.filter((a) => a.condition === "NEW" || a.condition === "GOOD").length;
  const maintenanceCount = assets.filter((a) => a.condition === "MAINTENANCE" || a.condition === "DAMAGED" || a.condition === "BROKEN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registre du Patrimoine & Équipements"
        description="Inventaire du matériel ecclésial, amortissement linéaire automatique, VNC et traçabilité des mouvements"
        breadcrumbs={[
          { label: "Patrimoine" },
          { label: "Actifs" },
        ]}
        action={
          canManagePatrimoine && hasPermission("creer") ? (
            <Button variant="default" size="default" onClick={openCreateModal}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nouvel Actif
            </Button>
          ) : undefined
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          title="Valeur Brute Totale"
          value={`${totalGrossValue.toLocaleString("fr-FR")} F`}
          subtitle={`${assets.length} équipements enregistrés`}
          icon={<Boxes className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />
        <StatCard
          title="Amortissement Cumulé"
          value={`${totalDepreciation.toLocaleString("fr-FR")} F`}
          subtitle="Calcul linéaire prorata temporis"
          icon={<TrendingDown className="w-6 h-6 text-warning-500" />}
          iconBgColor="bg-warning-50 dark:bg-warning-500/15"
        />
        <StatCard
          title="Valeur Nette Comptable (VNC)"
          value={`${totalNetBookValue.toLocaleString("fr-FR")} F`}
          subtitle={`${operationalCount} actifs opérationnels`}
          icon={<CheckCircle2 className="w-6 h-6 text-success-500" />}
          iconBgColor="bg-success-50 dark:bg-success-500/15"
        />
        <StatCard
          title="Maintenance / Alertes"
          value={maintenanceCount}
          subtitle="Réparation ou hors service"
          icon={<Wrench className="w-6 h-6 text-error-500" />}
          iconBgColor="bg-error-50 dark:bg-error-500/15"
        />
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par code, désignation, salle, département..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="h-10 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 shadow-theme-xs"
            >
              <option value="all">Tous les états matériels</option>
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assets DataTable */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Code & QR</TableHeaderCell>
          <TableHeaderCell>Équipement & Catégorie</TableHeaderCell>
          <TableHeaderCell>Emplacement / Dépt</TableHeaderCell>
          <TableHeaderCell>État</TableHeaderCell>
          <TableHeaderCell>Valeur Brute</TableHeaderCell>
          <TableHeaderCell>Amort. Cumulé</TableHeaderCell>
          <TableHeaderCell>VNC</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                Chargement des actifs...
              </TableCell>
            </TableRow>
          ) : filteredAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                Aucun équipement ne correspond à cette recherche.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAssetForQr(asset)}
                      title="Afficher le QR Code officiel"
                      className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {asset.asset_code}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                      {asset.name}
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      {asset.category || "Général"} · Taux {Number(asset.effective_depreciation_rate || 20).toFixed(1)}%/an
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {asset.location || asset.room}
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      {asset.department_name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>{getConditionBadge(asset.condition)}</TableCell>

                <TableCell>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {Number(asset.purchase_price || 0).toLocaleString("fr-FR")} F
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-warning-600 font-medium">
                    -{Number(asset.accumulated_depreciation || 0).toLocaleString("fr-FR")} F
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {Number(asset.net_book_value ?? asset.estimated_value ?? 0).toLocaleString("fr-FR")} F
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => openHistoryModal(asset)}
                      title="Historique des mouvements et contrôles"
                    >
                      <History className="w-3.5 h-3.5" />
                    </Button>
                    {canManagePatrimoine && hasPermission("modifier") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => openMovementModal(asset)}
                          title="Enregistrer un mouvement ou contrôle"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => openEditModal(asset)}
                          title="Modifier l'actif"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>

      {/* Modal Création / Édition d'Actif */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title={editingAsset ? `Modifier l'actif — ${editingAsset.asset_code}` : "Nouvel Actif Immobilisé"}
        description="Renseignez les données d'inventaire et la durée de vie pour le calcul automatique de l'amortissement"
      >
        <form onSubmit={handleSaveAsset} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label required>Désignation de l'équipement</Label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                placeholder="Ex: Console de mixage Yamaha MG16"
                required
              />
            </div>
            <div>
              <Label>Numéro d'inventaire</Label>
              <Input
                value={assetForm.asset_code}
                onChange={(e) => setAssetForm({ ...assetForm, asset_code: e.target.value })}
                placeholder="Auto si vide (HSC-ACT-...)"
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Input
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                placeholder="Sonorisation, Mobilier, Véhicule..."
              />
            </div>
            <div>
              <Label>Département affectataire</Label>
              <Select
                value={assetForm.department}
                onChange={(e) => setAssetForm({ ...assetForm, department: e.target.value })}
              >
                <option value="">Patrimoine Général</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Emplacement / Salle</Label>
              <Input
                value={assetForm.location}
                onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
                placeholder="Sanctuaire Principal, Régie..."
              />
            </div>
            <div>
              <Label>Date d'acquisition</Label>
              <Input
                type="date"
                value={assetForm.purchase_date}
                onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Valeur d'acquisition (FCFA)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={assetForm.purchase_price}
                onChange={(e) => setAssetForm({ ...assetForm, purchase_price: e.target.value })}
                placeholder="Ex: 1500000"
              />
            </div>
            <div>
              <Label>Durée de vie utile (années)</Label>
              <Input
                type="number"
                min="1"
                value={assetForm.useful_life_years}
                onChange={(e) => setAssetForm({ ...assetForm, useful_life_years: e.target.value })}
              />
            </div>
            <div>
              <Label>Taux d'amortissement (% / an)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={assetForm.depreciation_rate}
                onChange={(e) => setAssetForm({ ...assetForm, depreciation_rate: e.target.value })}
                placeholder="Auto = 100 / durée"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>État constaté</Label>
              <Select
                value={assetForm.condition}
                onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Description / Notes</Label>
              <Textarea
                rows={2}
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                placeholder="Numéro de série, fournisseur, remarques..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : editingAsset ? "Mettre à jour" : "Créer l'actif"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Nouveau Mouvement / Contrôle */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Mouvement / Contrôle — ${movementAsset?.name || ""}`}
        description="Affectation, déplacement, maintenance ou contrôle périodique"
      >
        <form onSubmit={handleCreateMovement} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label required>Type d'opération</Label>
              <Select
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
              >
                <option value="INSPECTION">Contrôle périodique</option>
                <option value="ASSIGNMENT">Affectation</option>
                <option value="TRANSFER">Déplacement</option>
                <option value="MAINTENANCE">Maintenance</option>
              </Select>
            </div>
            <div>
              <Label required>Date</Label>
              <Input
                type="date"
                value={movementForm.movement_date}
                onChange={(e) => setMovementForm({ ...movementForm, movement_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Emplacement d'origine</Label>
              <Input
                value={movementForm.from_location}
                onChange={(e) => setMovementForm({ ...movementForm, from_location: e.target.value })}
              />
            </div>
            <div>
              <Label>Nouvel emplacement</Label>
              <Input
                value={movementForm.to_location}
                onChange={(e) => setMovementForm({ ...movementForm, to_location: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label required>État constaté</Label>
              <Select
                value={movementForm.observed_condition}
                onChange={(e) => setMovementForm({ ...movementForm, observed_condition: e.target.value as AssetCondition })}
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Observations</Label>
              <Textarea
                rows={2}
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                placeholder="Détails du contrôle ou de l'intervention..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Valider l'opération"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Historique des Mouvements */}
      {selectedAssetForHistory && (
        <Modal
          isOpen={Boolean(selectedAssetForHistory)}
          onClose={() => setSelectedAssetForHistory(null)}
          title={`Historique — ${selectedAssetForHistory.asset_code} (${selectedAssetForHistory.name})`}
          description="Journal des affectations, déplacements, maintenances et contrôles périodiques"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {assetMovements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Aucun mouvement ou contrôle enregistré pour cet actif.
              </p>
            ) : (
              assetMovements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {m.movement_type_display || m.movement_type}
                    </span>
                    <span className="text-[11px] text-gray-400">{m.movement_date}</span>
                  </div>
                  {(m.from_location || m.to_location) && (
                    <p className="text-gray-600 dark:text-gray-300">
                      Lieu : {m.from_location || "—"} → {m.to_location || "—"}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {getConditionBadge(m.observed_condition)}
                    {m.responsible_name && (
                      <span className="text-[11px] text-gray-400">Par : {m.responsible_name}</span>
                    )}
                  </div>
                  {m.notes && <p className="text-gray-500 pt-1">{m.notes}</p>}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* QR Code Inspection Modal */}
      {selectedAssetForQr && (
        <Modal
          isOpen={Boolean(selectedAssetForQr)}
          onClose={() => setSelectedAssetForQr(null)}
          title={`Badge QR Code — ${selectedAssetForQr.asset_code}`}
          description="Identification physique pour collage sur l'équipement et inventaire mobile"
        >
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-theme-sm">
              <img
                src={selectedAssetForQr.qr_code_url}
                alt={selectedAssetForQr.asset_code}
                className="w-44 h-44 object-contain"
              />
            </div>

            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {selectedAssetForQr.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Localisation : {selectedAssetForQr.location || selectedAssetForQr.room} · {selectedAssetForQr.department_name}
              </p>
              <div className="mt-2 inline-block">
                {getConditionBadge(selectedAssetForQr.condition)}
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => window.print()}
              className="mt-2"
            >
              Imprimer l'Étiquette QR Code
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
