"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/context/TenantContext";
import { patrimoineService } from "@/services/patrimoine.service";
import { StockItem, StockMovement } from "@/types/patrimoine.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function StocksPage() {
  const { currentCampusId } = useTenant();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT">("OUT");
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState("");
  const [requestedBy, setRequestedBy] = useState("Grace Mavoungou (Caisse)");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      patrimoineService.getStocks(currentCampusId),
      patrimoineService.getMovements(),
    ]).then(([sData, mData]) => {
      setStocks(sData);
      setMovements(mData);
      if (sData.length > 0) setSelectedStockId(sData[0].id);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [currentCampusId]);

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockId || quantity <= 0) return;

    await patrimoineService.addStockMovement(
      selectedStockId,
      movementType,
      Number(quantity),
      reason || (movementType === "OUT" ? "Sortie pour culte dominical" : "Réapprovisionnement"),
      requestedBy
    );

    setIsModalOpen(false);
    setReason("");
    loadData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Stocks Consommables & Intendance"
        description="Suivi en temps réel des enveloppes de dîmes, livrets d'accueil, communion et alertes de réapprovisionnement"
        breadcrumbs={[
          { label: "Patrimoine", href: "/patrimoine/assets" },
          { label: "Stocks Consommables" },
        ]}
        action={
          <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau Mouvement de Stock
          </Button>
        }
      />

      {/* Stock Cards Grid with Visual Thresholds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stocks.map((item) => {
          const isUnderThreshold = item.quantity_in_stock <= item.alert_threshold;
          const ratio = Math.min(
            100,
            Math.round((item.quantity_in_stock / (item.alert_threshold * 2)) * 100)
          );

          return (
            <Card key={item.id} className="relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isUnderThreshold
                        ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                        : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    }`}
                  >
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      {item.category}
                    </span>
                  </div>
                </div>

                {isUnderThreshold ? (
                  <Badge variant="light" color="error" size="sm">
                    <AlertTriangle className="w-3 h-3" />
                    Seuil Atteint
                  </Badge>
                ) : (
                  <Badge variant="light" color="success" size="sm">
                    Disponible
                  </Badge>
                )}
              </div>

              {/* Stock Numbers */}
              <div className="my-4 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {item.quantity_in_stock}
                  </span>
                  <span className="text-xs text-gray-500 ml-1.5">{item.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">
                    Seuil d'alerte : <strong>{item.alert_threshold}</strong>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isUnderThreshold ? "bg-error-500" : "bg-brand-500"
                  }`}
                  style={{ width: `${Math.max(10, ratio)}%` }}
                />
              </div>

              {/* Card Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedStockId(item.id);
                    setMovementType("IN");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Entrée
                </button>

                <button
                  onClick={() => {
                    setSelectedStockId(item.id);
                    setMovementType("OUT");
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <Minus className="w-3.5 h-3.5" />
                  Sortie (Culte)
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Movements Table */}
      <ComponentCard
        title="Journal des Mouvements de Stock"
        desc="Traçabilité chronologique des entrées d'approvisionnement et sorties pour culte"
      >
        <TableContainer>
          <TableHead>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Article de Stock</TableHeaderCell>
            <TableHeaderCell>Quantité</TableHeaderCell>
            <TableHeaderCell>Motif & Circonstance</TableHeaderCell>
            <TableHeaderCell>Demandeur / Responsable</TableHeaderCell>
            <TableHeaderCell>Date & Heure</TableHeaderCell>
          </TableHead>
          <TableBody>
            {movements.map((mvt) => (
              <TableRow key={mvt.id}>
                <TableCell>
                  {mvt.movement_type === "IN" ? (
                    <Badge variant="light" color="success" size="sm">
                      <ArrowUpRight className="w-3 h-3" />
                      Entrée
                    </Badge>
                  ) : (
                    <Badge variant="light" color="warning" size="sm">
                      <ArrowDownRight className="w-3 h-3" />
                      Sortie Culte
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {mvt.stock_item_name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    {mvt.movement_type === "IN" ? `+${mvt.quantity}` : `-${mvt.quantity}`}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {mvt.reason}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {mvt.requested_by_name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mvt.created_at}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableContainer>
      </ComponentCard>

      {/* Movement Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Enregistrer un Mouvement de Stock"
          description="Saisie d'une entrée de livraison ou d'une sortie pour service/culte"
        >
          <form onSubmit={handleCreateMovement} className="space-y-4">
            <div>
              <Label htmlFor="stockItem" required>
                Article
              </Label>
              <Select
                id="stockItem"
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
              >
                {stocks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (En stock : {s.quantity_in_stock})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mvtType" required>
                  Type de mouvement
                </Label>
                <Select
                  id="mvtType"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as "IN" | "OUT")}
                >
                  <option value="OUT">Sortie (Culte / Réunion)</option>
                  <option value="IN">Entrée (Approvisionnement)</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="qty" required>
                  Quantité
                </Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason" required>
                Motif
              </Label>
              <Input
                id="reason"
                placeholder="Ex: Culte de sainte-cène, distribution diaconat..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="requestedBy" required>
                Responsable ayant demandé
              </Label>
              <Input
                id="requestedBy"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Valider le mouvement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
