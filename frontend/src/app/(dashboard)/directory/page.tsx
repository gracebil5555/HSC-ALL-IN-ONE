"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  MessageCircle,
  Phone,
  User,
  Building2,
  Briefcase,
  Sparkles,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Globe,
  Filter,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { directoryService } from "@/services/directory.service";
import { membersService } from "@/services/members.service";
import { BusinessProfile, BusinessCategory } from "@/types/directory.types";
import { Member } from "@/types/member.types";

const CATEGORIES: { key: string; label: string; color: "primary" | "success" | "warning" | "error" | "info" | "default" }[] = [
  { key: "all", label: "Tous les secteurs", color: "default" },
  { key: "SERVICES", label: "Services Pro & Conseil", color: "primary" },
  { key: "TRADE", label: "Commerce & Vente", color: "warning" },
  { key: "TECH", label: "Informatique & Tech", color: "info" },
  { key: "HEALTH", label: "Santé & Bien-être", color: "success" },
  { key: "ART", label: "Arts, Mode & Créativité", color: "primary" },
  { key: "OTHER", label: "Autres activités", color: "default" },
];

export default function DirectoryPage() {
  const { currentCampusId, currentCampus, isGlobalScope } = useTenant();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    category: "SERVICES",
    description: "",
    whatsapp_number: "",
    member_id: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bizData, membersData] = await Promise.all([
        directoryService.getBusinesses(currentCampusId),
        membersService.getMembers(currentCampusId),
      ]);
      setBusinesses(bizData);
      setMembers(membersData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'annuaire:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCampusId]);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesCategory = selectedCategory === "all" || b.category === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.business_name.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q) ||
      (b.member_name && b.member_name.toLowerCase().includes(q)) ||
      (b.whatsapp_number && b.whatsapp_number.includes(q));

    return matchesCategory && matchesSearch;
  });

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.business_name || !formData.whatsapp_number) return;

    setIsSubmitting(true);
    try {
      const campusIdNum = currentCampusId !== "all" ? parseInt(currentCampusId) : 1;
      const memberIdNum = formData.member_id ? parseInt(formData.member_id) : (members[0]?.id ? parseInt(members[0].id) : 1);

      await directoryService.createBusiness({
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        whatsapp_number: formData.whatsapp_number,
        campus: campusIdNum,
        member: memberIdNum,
      });

      setIsModalOpen(false);
      setFormData({
        business_name: "",
        category: "SERVICES",
        description: "",
        whatsapp_number: "",
        member_id: "",
      });
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la création de l'activité:", error);
      alert("Erreur lors de la création de l'activité. Veuillez vérifier les champs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "TECH":
        return <Badge color="info">Tech & Informatique</Badge>;
      case "SERVICES":
        return <Badge color="primary">Services Pro & Conseil</Badge>;
      case "TRADE":
        return <Badge color="warning">Commerce & Vente</Badge>;
      case "HEALTH":
        return <Badge color="success">Santé & Bien-être</Badge>;
      case "ART":
        return <Badge color="primary">Arts & Mode</Badge>;
      default:
        return <Badge color="light">Autre</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annuaire Économique & Métiers"
        description="Plateforme d'entraide fraternelle, promotion des compétences des fidèles et opportunités d'affaires de l'Église HSC."
        breadcrumbs={[{ label: "Communauté" }, { label: "Annuaire Économique" }]}
        action={
          <Button variant="default" size="default" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Enregistrer une Activité
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Entreprises & Métiers
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                {businesses.length}
              </h3>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {isGlobalScope ? "Réseau Mondial HSC" : currentCampus?.name || "Campus Actif"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Secteurs d'Activité
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                {new Set(businesses.map((b) => b.category)).size}
              </h3>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Diversité des compétences représentées
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mise en Relation Directe
              </p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                100% WhatsApp
              </h3>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Connexion instantanée sans intermédiaire
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Garantie Communauté
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                Fidèles HSC
              </h3>
            </div>
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Entrepreneurs vérifiés membres de l'église
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher une entreprise, métier, entrepreneur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredBusinesses.length} résultat{filteredBusinesses.length > 1 ? "s" : ""} trouvé{filteredBusinesses.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Business Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
          <p className="text-sm">Chargement de l'annuaire économique...</p>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              Aucune activité trouvée
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {search || selectedCategory !== "all"
                ? "Aucun résultat ne correspond à vos filtres actuels. Essayez de réinitialiser la recherche."
                : "Aucun profil d'activité n'est encore enregistré pour ce campus. Soyez le premier à inscrire votre entreprise !"}
            </p>
            {search || selectedCategory !== "all" ? (
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
              >
                Réinitialiser les filtres
              </Button>
            ) : (
              <Button variant="default" size="default" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Enregistrer une Entreprise
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((biz) => (
            <Card
              key={biz.id}
              className="flex flex-col justify-between hover:shadow-theme-md transition-all border border-gray-200 dark:border-gray-800 group"
            >
              <div className="space-y-4">
                {/* Header: Category Badge & Status */}
                <div className="flex items-center justify-between gap-2">
                  {getCategoryBadge(biz.category)}
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Vérifié HSC
                  </span>
                </div>

                {/* Business Name */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                    {biz.business_name}
                  </h3>
                  {biz.member_name && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Promoteur : <strong className="text-gray-700 dark:text-gray-300 font-medium">{biz.member_name}</strong></span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {biz.description}
                </p>
              </div>

              {/* Card Footer: WhatsApp Direct Action */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{biz.whatsapp_number}</span>
                </div>

                <a
                  href={biz.whatsapp_link || `https://wa.me/${biz.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-theme-xs transition-all hover:scale-102"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Enregistrer mon Activité */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enregistrer une Activité Économique"
        description="Faites connaître vos compétences ou votre entreprise aux fidèles de la communauté HSC."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBusiness} className="space-y-4">
          <div>
            <Label htmlFor="biz_name" required>
              Nom de l'Entreprise ou Activité
            </Label>
            <Input
              id="biz_name"
              placeholder="Ex: Cabinet Alpha Conseil, Menuiserie Divine..."
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="biz_cat" required>
                Secteur d'Activité
              </Label>
              <select
                id="biz_cat"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              >
                <option value="SERVICES">Services Professionnels & Conseil</option>
                <option value="TRADE">Commerce & Vente</option>
                <option value="TECH">Informatique & Tech</option>
                <option value="HEALTH">Santé & Bien-être</option>
                <option value="ART">Arts, Mode & Créativité</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <Label htmlFor="biz_wa" required>
                Numéro WhatsApp (Direct)
              </Label>
              <Input
                id="biz_wa"
                placeholder="+242 06 000 00 00"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="biz_member">
              Membre Propriétaire / Promoteur
            </Label>
            <select
              id="biz_member"
              value={formData.member_id}
              onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">-- Choisir un membre de l'église --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.phone || "Pas de tél"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="biz_desc" required>
              Description des Services & Offres
            </Label>
            <textarea
              id="biz_desc"
              rows={3}
              placeholder="Décrivez vos prestations, produits, horaires ou conditions préférentielles pour les membres..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              isLoading={isSubmitting}
            >
              Publier l'Activité
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
