"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { membersService } from "@/services/members.service";
import { MOCK_BRIGADES } from "@/mocks/brigades.mock";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Church,
  Users,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Calendar,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

export default function BrigadesPage() {
  const { currentCampusId, currentCampus } = useTenant();
  const [brigades, setBrigades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  const loadBrigades = async () => {
    setIsLoading(true);
    try {
      const data = await membersService.getBrigades(currentCampusId);
      if (data && data.length > 0) {
        // Map backend brigade to frontend structure with sensible fallbacks
        const mapped = data.map((b: any) => ({
          id: String(b.id),
          name: b.name,
          brigade_type: "ADULT",
          campus_id: String(b.campus),
          leader_name: b.leader_name || "Responsable non assigné",
          leader_phone: b.leader_phone || "Non renseigné",
          members_count: b.members_count || 0,
          meeting_schedule: "Chaque Jeudi à 18h30",
          meeting_place: b.neighborhood || "Secteur local",
          attendance_rate: 85,
        }));
        setBrigades(mapped);
      } else {
        // Fallback to mock data if backend has none
        setBrigades(
          currentCampusId === "all"
            ? MOCK_BRIGADES
            : MOCK_BRIGADES.filter((b) => b.campus_id === currentCampusId || b.campus_id === "campus-mpita-hq")
        );
      }
    } catch (error) {
      console.error("Error loading brigades:", error);
      setBrigades(MOCK_BRIGADES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrigades();
  }, [currentCampusId]);

  const handleCreateBrigade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const campusIdNum = currentCampusId !== "all" ? parseInt(currentCampusId) : 1;
      await membersService.createBrigade({
        name,
        neighborhood,
        campus: campusIdNum,
      });
      setIsModalOpen(false);
      setName("");
      setNeighborhood("");
      await loadBrigades();
    } catch (error) {
      console.error("Failed to create brigade:", error);
      alert("Erreur lors de la création de la brigade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brigades & Groupes de Croissance (GDC)"
        description="Cellules de proximité, encadrement des fidèles, réunions hebdomadaires et pointage des présences."
        breadcrumbs={[{ label: "Gouvernance" }, { label: "Brigades" }]}
        action={
          <Button variant="default" size="default" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Créer une Brigade
          </Button>
        }
      />

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-2"></div>
          <p className="text-sm">Chargement des brigades...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brigades.map((brigade) => (
            <Card key={brigade.id} className="relative flex flex-col justify-between hover:shadow-theme-sm transition-shadow">
              <div>
                {/* Header with Type Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex items-center justify-center font-bold">
                      <Church className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">
                        {brigade.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        {currentCampus?.name || "Campus Local"}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="light"
                    color={brigade.brigade_type === "ADULT" ? "primary" : "info"}
                  >
                    {brigade.brigade_type === "ADULT" ? "Adultes" : "Jeunesse"}
                  </Badge>
                </div>

                {/* Leader Info */}
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-2 mb-4">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Responsable Référent
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-gray-700 border border-gray-200 shrink-0 flex items-center justify-center font-bold text-xs text-brand-600">
                        {brigade.leader_name?.[0] || "R"}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-gray-800 dark:text-white block">
                          {brigade.leader_name}
                        </span>
                        {brigade.leader_phone && brigade.leader_phone !== "Non renseigné" ? (
                          <a
                            href={`tel:${brigade.leader_phone}`}
                            className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{brigade.leader_phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400">Non renseigné</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Location & Schedule */}
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{brigade.meeting_place}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{brigade.meeting_schedule}</span>
                  </div>
                </div>

                {/* Stats: Members count & Attendance rate */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100 dark:border-gray-800 mb-4 text-center">
                  <div>
                    <span className="text-xl font-black text-gray-900 dark:text-white block">
                      {brigade.members_count}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Fidèles Inscrits
                    </span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">
                      {brigade.attendance_rate}%
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Présence Moyenne
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <Link href="/members" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Effectif
                  </Button>
                </Link>
                <Link href="/ai/voice-to-action" className="w-full">
                  <Button variant="default" size="sm" className="w-full">
                    Pointage Express
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Créer une Brigade */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer une nouvelle Brigade"
        description="Enregistrez une cellule ou un groupe de croissance pour le campus actif."
        maxWidth="md"
      >
        <form onSubmit={handleCreateBrigade} className="space-y-4">
          <div>
            <Label htmlFor="b_name" required>
              Nom de la Brigade / GDC
            </Label>
            <Input
              id="b_name"
              placeholder="Ex: Brigade Saint-Paul (Mpita)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="b_area">
              Quartier / Lieu de Réunion
            </Label>
            <Input
              id="b_area"
              placeholder="Ex: Mpita Centre, arrêt bus pharmacie..."
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
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
              Créer la Brigade
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
