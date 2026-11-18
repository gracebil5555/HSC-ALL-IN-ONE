"use client";

import React, { useEffect, useState } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import {
  departmentsService,
  DepartmentItem,
  DepartmentCatalogItem,
} from "@/services/departments.service";
import { usersService } from "@/services/users.service";
import { CurrentUser } from "@/types/auth.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Layers,
  FolderPlus,
  UserCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  Shield,
  PlusCircle,
  Edit,
} from "lucide-react";

export default function DepartmentsPage() {
  const { currentCampusId, currentCampus, campuses, currentUser } = useTenant();
  const {
    isSuperSuperAdmin,
    isSuperAdmin,
    isSuperAdminOrAbove,
    isAdminDept,
    canManageDepartments,
  } = useRole();

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [catalog, setCatalog] = useState<DepartmentCatalogItem[]>([]);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const activeCampusIdNum =
    currentCampusId !== "all" && currentCampusId
      ? Number(currentCampusId)
      : Number(currentUser?.campus_id || campuses[0]?.id || 1);

  const [deptForm, setDeptForm] = useState({
    campus: activeCampusIdNum,
    catalog_item: "",
    name: "",
    code: "",
    description: "",
    admin: "",
    deputy: "",
  });

  const [catalogForm, setCatalogForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [leaderForm, setLeaderForm] = useState({
    admin: "",
    deputy: "",
    is_active: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptsData, catalogData, usersData] = await Promise.all([
        departmentsService.getDepartments(currentCampusId),
        departmentsService.getCatalog(),
        usersService.getUsers(currentCampusId),
      ]);
      setDepartments(deptsData);
      setCatalog(catalogData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erreur lors du chargement des départements :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCampusId]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    setIsSubmitting(true);
    try {
      const targetCampus = isSuperSuperAdmin
        ? Number(deptForm.campus || activeCampusIdNum)
        : Number(currentUser?.campus_id || activeCampusIdNum);
      await departmentsService.createDepartment({
        campus: targetCampus,
        name: deptForm.name.trim(),
        code:
          deptForm.code.trim() ||
          deptForm.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 20),
        description: deptForm.description,
        catalog_item: deptForm.catalog_item ? Number(deptForm.catalog_item) : null,
        admin: deptForm.admin ? Number(deptForm.admin) : null,
        deputy: deptForm.deputy ? Number(deptForm.deputy) : null,
        is_active: true,
      });
      setIsCreateModalOpen(false);
      setDeptForm({
        campus: activeCampusIdNum,
        catalog_item: "",
        name: "",
        code: "",
        description: "",
        admin: "",
        deputy: "",
      });
      await loadData();
    } catch (err) {
      alert("Impossible de créer ce département (il existe peut-être déjà pour cette Église).");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickActivateFromCatalog = async (cat: DepartmentCatalogItem) => {
    const targetCampus = Number(
      currentCampusId !== "all" ? currentCampusId : currentUser?.campus_id || campuses[0]?.id || 1
    );
    const existing = departments.find(
      (d) =>
        Number(d.campus) === targetCampus &&
        (d.code === cat.code || d.name.toLowerCase() === cat.name.toLowerCase())
    );
    try {
      if (existing) {
        await departmentsService.updateDepartment(existing.id, {
          is_active: !existing.is_active,
        });
      } else {
        await departmentsService.createDepartment({
          campus: targetCampus,
          name: cat.name,
          code: cat.code,
          description: cat.description,
          icon: cat.icon,
          catalog_item: cat.id,
          is_active: true,
        });
      }
      await loadData();
    } catch (err) {
      alert("Erreur lors de l'activation/désactivation de la structure.");
    }
  };

  const handleSaveLeaders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        deputy: leaderForm.deputy ? Number(leaderForm.deputy) : null,
      };
      if (isSuperAdminOrAbove) {
        payload.admin = leaderForm.admin ? Number(leaderForm.admin) : null;
        payload.is_active = leaderForm.is_active;
      }
      await departmentsService.updateDepartment(editingDept.id, payload);
      setEditingDept(null);
      await loadData();
    } catch (err) {
      alert("Erreur lors de la mise à jour des responsables.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogForm.name.trim() || !catalogForm.code.trim()) return;
    setIsSubmitting(true);
    try {
      await departmentsService.createCatalogItem({
        name: catalogForm.name.trim(),
        code: catalogForm.code.trim().toUpperCase(),
        description: catalogForm.description,
        is_default: true,
      });
      setIsCatalogModalOpen(false);
      setCatalogForm({ name: "", code: "", description: "" });
      await loadData();
    } catch (err) {
      alert("Erreur lors de l'ajout au catalogue global.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pour un Admin Dept, filtrer sur ses départements s'il n'est pas Super Admin
  const visibleDepartments = isSuperAdminOrAbove
    ? departments
    : departments.filter(
        (d) =>
          String(d.admin) === String(currentUser?.id) ||
          String(d.deputy) === String(currentUser?.id) ||
          (currentUser?.department_codes || []).includes((d.code || "").toUpperCase())
      );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Départements & Structures Configurables"
        description={
          isSuperSuperAdmin
            ? "Référentiel global des structures HSC et supervision des départements activés par chaque Église."
            : isSuperAdmin
            ? `Activez les structures utiles à ${currentCampus?.name || "votre Église"}, créez librement de nouveaux départements et nommez chaque Admin et Adjoint.`
            : "Gérez votre département et désignez votre adjoint."
        }
        breadcrumbs={[{ label: "Gouvernance" }, { label: "Départements" }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isSuperSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCatalogModalOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
                + Ajouter au Catalogue Global
              </Button>
            )}
            {canManageDepartments && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setDeptForm((prev) => ({
                    ...prev,
                    campus: activeCampusIdNum,
                  }));
                  setIsCreateModalOpen(true);
                }}
              >
                <FolderPlus className="w-4 h-4 mr-1.5" />
                + Créer un département
              </Button>
            )}
          </div>
        }
      />

      {/* Catalogue Recommandé HSC — Activation / Désactivation par Église (Section 8) */}
      {isSuperAdminOrAbove && (
        <ComponentCard
          title="Catalogue des Structures Recommandées par HSC"
          desc={
            currentCampus
              ? `Cliquez pour activer ou désactiver une structure dans ${currentCampus.name} sans modification de code.`
              : "Catalogue global des structures proposées aux Églises et extensions."
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {(Array.isArray(catalog) ? catalog : []).map((cat) => {
              const targetCampus = Number(
                currentCampusId !== "all"
                  ? currentCampusId
                  : currentUser?.campus_id || campuses[0]?.id || 1
              );
              const matched = departments.find(
                (d) =>
                  Number(d.campus) === targetCampus &&
                  (d.code === cat.code ||
                    d.name.toLowerCase() === cat.name.toLowerCase())
              );
              const isActive = Boolean(matched?.is_active);

              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? "border-brand-300 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-500/10"
                      : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 opacity-80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {cat.name}
                      </span>
                      <Badge
                        variant="light"
                        color={isActive ? "success" : "light"}
                        size="sm"
                      >
                        {isActive ? "Activé" : "Non activé"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  {canManageDepartments && (
                    <button
                      type="button"
                      onClick={() => handleQuickActivateFromCatalog(cat)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                          : "bg-brand-600 text-white hover:bg-brand-700"
                      }`}
                    >
                      {isActive ? "Désactiver pour l'Église" : "+ Activer cette structure"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ComponentCard>
      )}

      {/* Liste des Départements de l'Église avec Admin & Adjoint */}
      <ComponentCard
        title={
          isSuperSuperAdmin && currentCampusId === "all"
            ? "Départements Activés & Créés dans le Réseau"
            : `Départements de ${currentCampus?.name || "l'Église"}`
        }
        desc="Chaque département possède un Admin titulaire et peut avoir un Adjoint (Section 8)."
      >
        {isLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Chargement des départements…
          </div>
        ) : visibleDepartments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Aucun département activé pour le moment dans ce périmètre.
            </p>
            {canManageDepartments && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <FolderPlus className="w-4 h-4 mr-1.5" />
                + Créer un premier département (ex: Ministère des Jeunes)
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Array.isArray(visibleDepartments) ? visibleDepartments : []).map((dept) => (
              <Card
                key={dept.id}
                className="flex flex-col justify-between border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                          {dept.name}
                        </h3>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {dept.campus_name || currentCampus?.name || "Église locale"}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="light"
                      color={dept.is_active ? "success" : "warning"}
                      size="sm"
                    >
                      {dept.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>

                  {dept.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {dept.description}
                    </p>
                  )}

                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-2 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-brand-500" />
                        Admin :
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {dept.admin_name || "Non assigné"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Adjoint :
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {dept.deputy_name || "Aucun adjoint"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDept(dept);
                      setLeaderForm({
                        admin: dept.admin ? String(dept.admin) : "",
                        deputy: dept.deputy ? String(dept.deputy) : "",
                        is_active: dept.is_active,
                      });
                    }}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    {isSuperAdminOrAbove
                      ? "Gérer Admin / Adjoint"
                      : "+ Ajouter / Changer mon Adjoint"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ComponentCard>

      {/* Modal: Créer librement un Département (Section 8 & 20) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un Nouveau Département"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <p className="text-xs text-gray-500">
            Créez librement un nouveau département (ex: « Ministère des Jeunes », « Communication », « Évangélisation ») ou activez une structure du catalogue.
          </p>

          {isSuperSuperAdmin && (
            <div>
              <Label required>Église / Extension cible</Label>
              <select
                value={deptForm.campus}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, campus: Number(e.target.value) })
                }
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                {(Array.isArray(campuses) ? campuses : []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Basé sur le Catalogue Recommandé (Optionnel)</Label>
            <select
              value={deptForm.catalog_item}
              onChange={(e) => {
                const catId = e.target.value;
                const found = (Array.isArray(catalog) ? catalog : []).find((c) => String(c.id) === catId);
                if (found) {
                  setDeptForm({
                    ...deptForm,
                    catalog_item: catId,
                    name: found.name,
                    code: found.code,
                    description: found.description,
                  });
                } else {
                  setDeptForm({ ...deptForm, catalog_item: "" });
                }
              }}
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Création libre personnalisée --</option>
              {(Array.isArray(catalog) ? catalog : []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label required>Nom du Département</Label>
            <Input
              required
              placeholder="Ex: Ministère des Jeunes"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Code technique (auto-généré si vide)</Label>
            <Input
              placeholder="Ex: JEUNESSE, FINANCES, PATRIMOINE, CHORALE..."
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              placeholder="Mission et périmètre du département..."
              value={deptForm.description}
              onChange={(e) =>
                setDeptForm({ ...deptForm, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Admin du Département</Label>
              <select
                value={deptForm.admin}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, admin: e.target.value })
                }
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="">-- Aucun pour l'instant --</option>
                {(Array.isArray(users) ? users : []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Adjoint du Département</Label>
              <select
                value={deptForm.deputy}
                onChange={(e) =>
                  setDeptForm({ ...deptForm, deputy: e.target.value })
                }
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="">-- Aucun adjoint --</option>
                {(Array.isArray(users) ? users : []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Créer le Département
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gérer Admin & Adjoint d'un Département */}
      <Modal
        isOpen={Boolean(editingDept)}
        onClose={() => setEditingDept(null)}
        title={`Responsables — ${editingDept?.name || ""}`}
      >
        <form onSubmit={handleSaveLeaders} className="space-y-4">
          {isSuperAdminOrAbove && (
            <div>
              <Label>Admin Titulaire du Département</Label>
              <select
                value={leaderForm.admin}
                onChange={(e) =>
                  setLeaderForm({ ...leaderForm, admin: e.target.value })
                }
                className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
              >
                <option value="">-- Non assigné --</option>
                {(Array.isArray(users) ? users : []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>Adjoint du Département (Section 7 & 8)</Label>
            <select
              value={leaderForm.deputy}
              onChange={(e) =>
                setLeaderForm({ ...leaderForm, deputy: e.target.value })
              }
              className="w-full h-10 px-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-white"
            >
              <option value="">-- Aucun adjoint --</option>
              {(Array.isArray(users) ? users : [])
                .filter((u) => String(u.id) !== String(leaderForm.admin))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.ecclesial_function_display || u.ecclesial_function})
                  </option>
                ))}
            </select>
          </div>

          {isSuperAdminOrAbove && (
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={leaderForm.is_active}
                onChange={(e) =>
                  setLeaderForm({ ...leaderForm, is_active: e.target.checked })
                }
                className="rounded border-gray-300 text-brand-600"
              />
              <span>Département actif dans cette Église</span>
            </label>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingDept(null)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ajouter au Catalogue Global (Super Super Admin - Section 5) */}
      <Modal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        title="Ajouter une Structure au Catalogue Global HSC"
      >
        <form onSubmit={handleCreateCatalogItem} className="space-y-4">
          <div>
            <Label required>Nom de la Structure</Label>
            <Input
              required
              placeholder="Ex: Ministère des Couples & Familles"
              value={catalogForm.name}
              onChange={(e) =>
                setCatalogForm({ ...catalogForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label required>Code unique</Label>
            <Input
              required
              placeholder="Ex: FAMILLE"
              value={catalogForm.code}
              onChange={(e) =>
                setCatalogForm({ ...catalogForm, code: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              placeholder="Description proposée à toutes les Églises..."
              value={catalogForm.description}
              onChange={(e) =>
                setCatalogForm({ ...catalogForm, description: e.target.value })
              }
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCatalogModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="default" isLoading={isSubmitting}>
              Ajouter au Référentiel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
