"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge, BadgeColor } from "@/components/ui/Badge";
import { membersService } from "@/services/members.service";
import {
  EcclesialFunctionCatalogItem,
  MemberStatusCatalogItem,
} from "@/types/member.types";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Power,
  Tag,
  Award,
} from "lucide-react";

interface CatalogConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  initialTab?: "functions" | "statuses";
}

const COLOR_OPTIONS: { value: BadgeColor; label: string }[] = [
  { value: "primary", label: "Principal (Bleu)" },
  { value: "success", label: "Succès (Vert)" },
  { value: "info", label: "Info (Cyan)" },
  { value: "warning", label: "Attention (Orange)" },
  { value: "error", label: "Alerte (Rouge)" },
  { value: "light", label: "Neutre (Gris)" },
];

export const CatalogConfigModal: React.FC<CatalogConfigModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialTab = "functions",
}) => {
  const [activeTab, setActiveTab] = useState<"functions" | "statuses">(initialTab);
  const [functionsList, setFunctionsList] = useState<EcclesialFunctionCatalogItem[]>([]);
  const [statusesList, setStatusesList] = useState<MemberStatusCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New function form
  const [newFuncCode, setNewFuncCode] = useState("");
  const [newFuncLabel, setNewFuncLabel] = useState("");
  const [newFuncRank, setNewFuncRank] = useState<number>(10);

  // Edit function state
  const [editingFuncId, setEditingFuncId] = useState<number | null>(null);
  const [editFuncLabel, setEditFuncLabel] = useState("");
  const [editFuncRank, setEditFuncRank] = useState<number>(0);

  // New status form
  const [newStatusCode, setNewStatusCode] = useState("");
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState<string>("primary");

  // Edit status state
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editStatusLabel, setEditStatusLabel] = useState("");
  const [editStatusColor, setEditStatusColor] = useState<string>("primary");

  const loadCatalogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [funcs, stats] = await Promise.all([
        membersService.getEcclesialFunctions(false),
        membersService.getMemberStatuses(false),
      ]);
      setFunctionsList([...funcs].sort((a, b) => (a.rank_order ?? 0) - (b.rank_order ?? 0)));
      setStatusesList(stats);
    } catch (err) {
      console.error("Erreur chargement référentiels:", err);
      setErrorMsg("Impossible de charger les référentiels.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadCatalogs();
    }
  }, [isOpen, initialTab, loadCatalogs]);

  // ── Ecclesial Functions Handlers ──
  const handleCreateFunction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuncCode.trim() || !newFuncLabel.trim()) return;
    setErrorMsg(null);
    try {
      await membersService.createEcclesialFunction({
        code: newFuncCode.trim().toUpperCase().replace(/\s+/g, "_"),
        label: newFuncLabel.trim(),
        rank_order: Number(newFuncRank) || 0,
        is_active: true,
      });
      setNewFuncCode("");
      setNewFuncLabel("");
      setNewFuncRank((functionsList.length + 1) * 10);
      await loadCatalogs();
      onUpdated?.();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.code?.[0] || "Erreur lors de la création de la fonction.");
    }
  };

  const handleSaveEditFunction = async (id: number) => {
    if (!editFuncLabel.trim()) return;
    setErrorMsg(null);
    try {
      await membersService.updateEcclesialFunction(id, {
        label: editFuncLabel.trim(),
        rank_order: Number(editFuncRank) || 0,
      });
      setEditingFuncId(null);
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Erreur lors de la modification de la fonction.");
    }
  };

  const handleToggleFunctionActive = async (item: EcclesialFunctionCatalogItem) => {
    setErrorMsg(null);
    try {
      await membersService.updateEcclesialFunction(item.id, { is_active: !item.is_active });
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Impossible de modifier le statut actif.");
    }
  };

  const handleMoveFunction = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= functionsList.length) return;
    const current = functionsList[index];
    const neighbor = functionsList[targetIndex];
    const currentRank = current.rank_order ?? index;
    const neighborRank = neighbor.rank_order ?? targetIndex;
    let newCurrentRank = neighborRank;
    let newNeighborRank = currentRank;
    if (currentRank === neighborRank) {
      if (direction === -1) {
        newCurrentRank = Math.max(0, neighborRank - 1);
        newNeighborRank = newCurrentRank === neighborRank ? neighborRank + 1 : neighborRank;
      } else {
        newCurrentRank = neighborRank + 1;
        newNeighborRank = currentRank;
      }
    }

    setErrorMsg(null);
    try {
      await Promise.all([
        membersService.updateEcclesialFunction(current.id, { rank_order: newCurrentRank }),
        membersService.updateEcclesialFunction(neighbor.id, { rank_order: newNeighborRank }),
      ]);
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Erreur lors du réordonnancement.");
    }
  };

  const handleDeleteFunction = async (id: number, label: string) => {
    if (!confirm(`Supprimer la fonction "${label}" ?`)) return;
    setErrorMsg(null);
    try {
      await membersService.deleteEcclesialFunction(id);
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Impossible de supprimer cette fonction.");
    }
  };

  // ── Member Statuses Handlers ──
  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusCode.trim() || !newStatusLabel.trim()) return;
    setErrorMsg(null);
    try {
      await membersService.createMemberStatus({
        code: newStatusCode.trim().toUpperCase().replace(/\s+/g, "_"),
        label: newStatusLabel.trim(),
        color: newStatusColor,
        is_active: true,
      });
      setNewStatusCode("");
      setNewStatusLabel("");
      setNewStatusColor("primary");
      await loadCatalogs();
      onUpdated?.();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.code?.[0] || "Erreur lors de la création du statut.");
    }
  };

  const handleSaveEditStatus = async (id: number) => {
    if (!editStatusLabel.trim()) return;
    setErrorMsg(null);
    try {
      await membersService.updateMemberStatus(id, {
        label: editStatusLabel.trim(),
        color: editStatusColor,
      });
      setEditingStatusId(null);
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Erreur lors de la modification du statut.");
    }
  };

  const handleToggleStatusActive = async (item: MemberStatusCatalogItem) => {
    setErrorMsg(null);
    try {
      await membersService.updateMemberStatus(item.id, { is_active: !item.is_active });
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Impossible de modifier le statut actif.");
    }
  };

  const handleDeleteStatus = async (id: number, label: string) => {
    if (!confirm(`Supprimer le statut "${label}" ?`)) return;
    setErrorMsg(null);
    try {
      await membersService.deleteMemberStatus(id);
      await loadCatalogs();
      onUpdated?.();
    } catch {
      setErrorMsg("Impossible de supprimer ce statut.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Référentiels Ecclésiaux & Statuts (Super-Super Admin)"
      description="Configurez dynamiquement les fonctions ecclésiales (Sections 22, 25) et les statuts d'activité des membres (Section 26)."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("functions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "functions"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Fonctions Ecclésiales ({functionsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("statuses")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === "statuses"
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Statuts de Membres ({statusesList.length})
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 text-xs">
            {errorMsg}
          </div>
        )}

        {activeTab === "functions" ? (
          <div className="space-y-4">
            {/* Formulaire ajout fonction */}
            <form
              onSubmit={handleCreateFunction}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800"
            >
              <div className="sm:col-span-3">
                <Label htmlFor="newFuncCode" className="text-[11px]">Code</Label>
                <Input
                  id="newFuncCode"
                  placeholder="EX: EVANGELISTE"
                  value={newFuncCode}
                  onChange={(e) => setNewFuncCode(e.target.value)}
                  className="h-8 text-xs uppercase"
                  required
                />
              </div>
              <div className="sm:col-span-5">
                <Label htmlFor="newFuncLabel" className="text-[11px]">Libellé</Label>
                <Input
                  id="newFuncLabel"
                  placeholder="Ex: Évangéliste"
                  value={newFuncLabel}
                  onChange={(e) => setNewFuncLabel(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="newFuncRank" className="text-[11px]">Ordre</Label>
                <Input
                  id="newFuncRank"
                  type="number"
                  value={newFuncRank}
                  onChange={(e) => setNewFuncRank(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="sm:col-span-2 flex items-end">
                <Button type="submit" size="sm" className="w-full h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
            </form>

            {/* Liste fonctions */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-gray-400">Chargement…</div>
              ) : functionsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">Aucune fonction configurée.</div>
              ) : (
                functionsList.map((fn, idx) => (
                  <div
                    key={fn.id}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                  >
                    {editingFuncId === fn.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editFuncLabel}
                          onChange={(e) => setEditFuncLabel(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Input
                          type="number"
                          value={editFuncRank}
                          onChange={(e) => setEditFuncRank(Number(e.target.value))}
                          className="h-7 text-xs w-20"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="h-7 px-2"
                          onClick={() => handleSaveEditFunction(fn.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => setEditingFuncId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-mono text-gray-400 w-7 text-center">
                            #{fn.rank_order}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {fn.label}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400">({fn.code})</span>
                            </div>
                          </div>
                          <Badge variant="light" color={fn.is_active ? "success" : "light"} size="sm">
                            {fn.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            disabled={idx === 0}
                            onClick={() => handleMoveFunction(idx, -1)}
                            title="Monter"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            disabled={idx === functionsList.length - 1}
                            onClick={() => handleMoveFunction(idx, 1)}
                            title="Descendre"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            onClick={() => {
                              setEditingFuncId(fn.id);
                              setEditFuncLabel(fn.label);
                              setEditFuncRank(fn.rank_order);
                            }}
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            onClick={() => handleToggleFunctionActive(fn)}
                            title={fn.is_active ? "Désactiver" : "Activer"}
                          >
                            <Power className={`w-3 h-3 ${fn.is_active ? "text-success-600" : "text-gray-400"}`} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5 text-error-600"
                            onClick={() => handleDeleteFunction(fn.id, fn.label)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Formulaire ajout statut */}
            <form
              onSubmit={handleCreateStatus}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800"
            >
              <div className="sm:col-span-3">
                <Label htmlFor="newStatusCode" className="text-[11px]">Code</Label>
                <Input
                  id="newStatusCode"
                  placeholder="EX: VISITEUR"
                  value={newStatusCode}
                  onChange={(e) => setNewStatusCode(e.target.value)}
                  className="h-8 text-xs uppercase"
                  required
                />
              </div>
              <div className="sm:col-span-4">
                <Label htmlFor="newStatusLabel" className="text-[11px]">Libellé</Label>
                <Input
                  id="newStatusLabel"
                  placeholder="Ex: Visiteur Régulier"
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor="newStatusColor" className="text-[11px]">Couleur</Label>
                <Select
                  id="newStatusColor"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="h-8 text-xs"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2 flex items-end">
                <Button type="submit" size="sm" className="w-full h-8 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Ajouter
                </Button>
              </div>
            </form>

            {/* Liste statuts */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-gray-400">Chargement…</div>
              ) : statusesList.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">Aucun statut configuré.</div>
              ) : (
                statusesList.map((st) => (
                  <div
                    key={st.id}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                  >
                    {editingStatusId === st.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editStatusLabel}
                          onChange={(e) => setEditStatusLabel(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Select
                          value={editStatusColor}
                          onChange={(e) => setEditStatusColor(e.target.value)}
                          className="h-7 text-xs w-36"
                        >
                          {COLOR_OPTIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </Select>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          className="h-7 px-2"
                          onClick={() => handleSaveEditStatus(st.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => setEditingStatusId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Badge variant="light" color={(st.color as BadgeColor) || "primary"} size="sm">
                            {st.label}
                          </Badge>
                          <span className="text-[10px] font-mono text-gray-400">({st.code})</span>
                          <Badge variant="light" color={st.is_active ? "success" : "light"} size="sm">
                            {st.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            onClick={() => {
                              setEditingStatusId(st.id);
                              setEditStatusLabel(st.label);
                              setEditStatusColor(st.color || "primary");
                            }}
                            title="Modifier"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5"
                            onClick={() => handleToggleStatusActive(st)}
                            title={st.is_active ? "Désactiver" : "Activer"}
                          >
                            <Power className={`w-3 h-3 ${st.is_active ? "text-success-600" : "text-gray-400"}`} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-1.5 text-error-600"
                            onClick={() => handleDeleteStatus(st.id, st.label)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
