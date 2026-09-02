"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { membersService } from "@/services/members.service";
import { Member, AssimilationStage } from "@/types/member.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  GitMerge,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Phone,
  User,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

const STAGES: {
  key: AssimilationStage;
  title: string;
  subtitle: string;
  color: "warning" | "primary" | "info" | "primary" | "success";
}[] = [
  {
    key: "ACCUEIL",
    title: "1. Accueil",
    subtitle: "1ère visite dimanche",
    color: "warning",
  },
  {
    key: "MODULE_1",
    title: "2. Module 1",
    subtitle: "Affermissement (4 sessions)",
    color: "primary",
  },
  {
    key: "MODULE_2",
    title: "3. Module 2",
    subtitle: "Doctrine & Vie (5 sessions)",
    color: "info",
  },
  {
    key: "BAPTEME",
    title: "4. Candidats Baptême",
    subtitle: "Entretien & immersion",
    color: "primary",
  },
  {
    key: "INTEGRE",
    title: "5. Intégration",
    subtitle: "Département actif",
    color: "success",
  },
];

export default function AssimilationKanbanPage() {
  const { currentCampusId } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    membersService.getMembers(currentCampusId).then((data) => {
      setMembers(data);
      setIsLoading(false);
    });
  }, [currentCampusId]);

  const moveMember = async (
    memberId: string,
    direction: "prev" | "next"
  ) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const currentIndex = STAGES.findIndex((s) => s.key === member.assimilation_stage);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < STAGES.length) {
      const newStage = STAGES[newIndex].key;
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, assimilation_stage: newStage } : m
        )
      );
      await membersService.updateMemberStage(memberId, newStage);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline d'Assimilation des Âmes (Kanban 5 Étapes)"
        description="Parcours structuré de la 1ère visite jusqu'à l'intégration dans un département de service"
        breadcrumbs={[
          { label: "Assimilation" },
        ]}
        action={
          <Link href="/members/new">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Accueillir une Âme
            </Button>
          </Link>
        }
      />

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[680px]">
        {STAGES.map((col, colIdx) => {
          const stageMembers = members.filter((m) => m.assimilation_stage === col.key);

          return (
            <div
              key={col.key}
              className="flex flex-col w-72 sm:w-80 shrink-0 rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-900/50 shadow-theme-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 dark:border-gray-800 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      {col.title}
                    </h3>
                    <span className="flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {stageMembers.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {col.subtitle}
                  </p>
                </div>

                <Badge variant="light" color={col.color} size="sm">
                  Étape {colIdx + 1}/5
                </Badge>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    Chargement...
                  </div>
                ) : stageMembers.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-400">
                    Aucune âme à cette étape
                  </div>
                ) : (
                  stageMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-800/80 hover:shadow-theme-sm transition-all group"
                    >
                      {/* Top row: Avatar + Name + Stage progress */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.first_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-brand-600">
                                {member.first_name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/members/${member.id}`}
                              className="font-semibold text-xs text-gray-900 dark:text-white hover:text-brand-600 block transition-colors"
                            >
                              {member.first_name} {member.last_name}
                            </Link>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {member.residential_area}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {member.assimilation_progress}
                        </span>
                      </div>

                      {/* Brigade / Tag */}
                      <div className="mb-3">
                        {member.brigade_name ? (
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                            {member.brigade_name}
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            Brigade : Non affecté
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Direct WhatsApp + Stage arrows */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                        <a
                          href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-success-600 hover:text-success-700 text-[11px] font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <div className="flex items-center gap-1">
                          {colIdx > 0 && (
                            <button
                              onClick={() => moveMember(member.id, "prev")}
                              title="Rétrograder à l'étape précédente"
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 dark:hover:bg-gray-700 transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}

                          {colIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => moveMember(member.id, "next")}
                              title="Faire progresser à l'étape suivante"
                              className="p-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:hover:bg-brand-500/30 transition-colors flex items-center gap-0.5 font-semibold text-[10px] px-1.5"
                            >
                              <span>Suivant</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
