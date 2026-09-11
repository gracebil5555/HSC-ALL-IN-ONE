"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { patrimoineService } from "@/services/patrimoine.service";
import { Asset, AssetCondition } from "@/types/patrimoine.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  QrCode,
  Search,
  PlusCircle,
  Eye,
  Building,
  MapPin,
} from "lucide-react";

export default function AssetsPage() {
  const { currentCampusId } = useTenant();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [selectedAssetForQr, setSelectedAssetForQr] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    patrimoineService.getAssets(currentCampusId).then((data) => {
      setAssets(data);
      setIsLoading(false);
    });
  }, [currentCampusId]);

  const filteredAssets = assets.filter((a) => {
    const query = search.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(query) ||
      a.asset_code.toLowerCase().includes(query) ||
      a.room.toLowerCase().includes(query) ||
      a.department_name.toLowerCase().includes(query);

    const matchesCondition =
      conditionFilter === "all" ? true : a.condition === conditionFilter;

    return matchesSearch && matchesCondition;
  });

  const getConditionBadge = (condition: AssetCondition) => {
    switch (condition) {
      case "NEW":
        return <Badge variant="light" color="success" size="sm">Neuf</Badge>;
      case "GOOD":
        return <Badge variant="light" color="info" size="sm">Bon état</Badge>;
      case "MAINTENANCE":
        return <Badge variant="light" color="warning" size="sm">En réparation</Badge>;
      case "BROKEN":
        return <Badge variant="light" color="error" size="sm">Hors service</Badge>;
    }
  };

  const totalValue = assets.reduce((sum, a) => sum + a.estimated_value, 0);
  const operationalCount = assets.filter((a) => a.condition === "NEW" || a.condition === "GOOD").length;
  const maintenanceCount = assets.filter((a) => a.condition === "MAINTENANCE").length;
  const brokenCount = assets.filter((a) => a.condition === "BROKEN").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registre du Patrimoine & Équipements"
        description="Inventaire du matériel ecclésial, localisation dans les sanctuaires et QR Codes de traçabilité"
        breadcrumbs={[
          { label: "Patrimoine" },
          { label: "Actifs" },
        ]}
        action={
          <Button variant="default" size="default">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nouvel Actif
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <StatCard
          title="Total Équipements"
          value={assets.length}
          subtitle={`Valeur estimée : ${(totalValue / 1000000).toFixed(1)}M FCFA`}
          icon={<Boxes className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />
        <StatCard
          title="Opérationnels"
          value={operationalCount}
          change={`${Math.round((operationalCount / (assets.length || 1)) * 100)}%`}
          trend="up"
          subtitle="Neufs ou en bon état"
          icon={<CheckCircle2 className="w-6 h-6 text-success-500" />}
          iconBgColor="bg-success-50 dark:bg-success-500/15"
        />
        <StatCard
          title="En Réparation"
          value={maintenanceCount}
          trend="down"
          subtitle="Atelier ou technicien"
          icon={<Wrench className="w-6 h-6 text-warning-500" />}
          iconBgColor="bg-warning-50 dark:bg-warning-500/15"
        />
        <StatCard
          title="Hors Service"
          value={brokenCount}
          trend="down"
          subtitle="Remplacement requis"
          icon={<AlertTriangle className="w-6 h-6 text-error-500" />}
          iconBgColor="bg-error-50 dark:bg-error-500/15"
        />
      </div>

      {/* Filter and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par code (HSC-SON-...), désignation, salle..."
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
              <option value="NEW">Neuf</option>
              <option value="GOOD">Bon état</option>
              <option value="MAINTENANCE">En réparation</option>
              <option value="BROKEN">Hors service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets DataTable */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Code Actif & QR</TableHeaderCell>
          <TableHeaderCell>Désignation de l'Équipement</TableHeaderCell>
          <TableHeaderCell>Département Référent</TableHeaderCell>
          <TableHeaderCell>Emplacement / Salle</TableHeaderCell>
          <TableHeaderCell>État Physique</TableHeaderCell>
          <TableHeaderCell>Valeur Estimée</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Chargement des actifs...
              </TableCell>
            </TableRow>
          ) : filteredAssets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                Aucun équipement ne correspond à cette recherche.
              </TableCell>
            </TableRow>
          ) : (
            filteredAssets.map((asset) => (
              <TableRow key={asset.id}>
                {/* Code & QR Trigger */}
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

                {/* Name */}
                <TableCell>
                  <div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                      {asset.name}
                    </span>
                    {asset.notes && (
                      <span className="text-[11px] text-gray-400 line-clamp-1">
                        {asset.notes}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Department */}
                <TableCell>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {asset.department_name}
                  </span>
                </TableCell>

                {/* Room */}
                <TableCell>
                  <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {asset.room}
                  </span>
                </TableCell>

                {/* Condition */}
                <TableCell>{getConditionBadge(asset.condition)}</TableCell>

                {/* Value */}
                <TableCell>
                  <span className="text-xs font-bold text-gray-800 dark:text-white">
                    {asset.estimated_value.toLocaleString("fr-FR")} FCFA
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5"
                    onClick={() => setSelectedAssetForQr(asset)}
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1" />
                    Badge QR
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </TableContainer>

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
                Localisation : {selectedAssetForQr.room} · {selectedAssetForQr.department_name}
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
