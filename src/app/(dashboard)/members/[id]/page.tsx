"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { membersService } from "@/services/members.service";
import { Member } from "@/types/member.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Church,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GitMerge,
  Droplet,
} from "lucide-react";

export default function MemberDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      membersService.getMemberById(id).then((data) => {
        setMember(data);
        setIsLoading(false);
      });
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Chargement de la fiche fidèle...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Fidèle introuvable</h3>
        <Link href="/members">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour à l'annuaire
          </Button>
        </Link>
      </div>
    );
  }

  const stages = [
    { key: "ACCUEIL", label: "1. Accueil", desc: "1ère visite dimanche" },
    { key: "MODULE_1", label: "2. Module 1", desc: "Affermissement (4 sessions)" },
    { key: "MODULE_2", label: "3. Module 2", desc: "Doctrine & Vie (5 sessions)" },
    { key: "BAPTEME", label: "4. Baptême", desc: "Validation par immersion" },
    { key: "INTEGRE", label: "5. Intégré", desc: "Affecté en département" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === member.assimilation_stage);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title={`${member.first_name} ${member.last_name}`}
        description={`Fiche fidèle matricule #${member.id} · Enregistré le ${member.joined_date}`}
        breadcrumbs={[
          { label: "Membres", href: "/members" },
          { label: `${member.first_name} ${member.last_name}` },
        ]}
        action={
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour à l'annuaire
            </Button>
          </Link>
        }
      />

      {/* Top Profile Summary Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-100 dark:bg-gray-800 border-2 border-brand-200 dark:border-gray-700 shrink-0">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-brand-600">
                  {member.first_name[0]}
                  {member.last_name[0]}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {member.first_name} {member.last_name}
                </h2>
                {member.is_baptized ? (
                  <Badge variant="light" color="success" size="sm">
                    <Droplet className="w-3 h-3" />
                    Baptisé
                  </Badge>
                ) : (
                  <Badge variant="light" color="warning" size="sm">
                    Non baptisé
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {member.residential_area}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Depuis {member.joined_date}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="success" size="sm">
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            </a>
            <a href={`tel:${member.phone}`}>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-1.5" />
                Appeler
              </Button>
            </a>
            <Link href="/alerts">
              <Button variant="danger" size="sm">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Créer Alerte
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Grid: Affiliations & Spiritual Journey */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Affiliations */}
        <ComponentCard title="Affiliations & Rôles Ecclésiaux">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Campus de rattachement</span>
              <span className="font-semibold text-gray-900 dark:text-white">Siège Mondial - Mpita</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Brigade / GDC (Optionnelle)</span>
              {member.brigade_name ? (
                <Badge variant="light" color="primary" size="sm">
                  {member.brigade_name}
                </Badge>
              ) : (
                <Badge variant="light" color="light" size="sm" className="border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                  Non affecté
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">Département de service</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {member.department_name || "Aucun département"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-gray-500">Date de baptême</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {member.baptism_date || "Non baptisé(e) à ce jour"}
              </span>
            </div>
          </div>
        </ComponentCard>

        {/* Observations */}
        <ComponentCard title="Notes Pastorales & Circonstances">
          <div className="space-y-3 text-xs">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl">
              {member.notes || "Aucune note pastorale particulière enregistrée pour ce fidèle."}
            </p>

            <div className="p-3 rounded-xl border border-brand-100 dark:border-brand-500/20 bg-brand-50/40 dark:bg-brand-500/5">
              <span className="font-semibold text-brand-800 dark:text-brand-300 block mb-1">
                Objectif de Suivi
              </span>
              <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                Maintenir le contact hebdomadaire via l'animateur de brigade et encourager la fréquentation assidue du culte d'affermissement.
              </p>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Stepper Assimilation Progression */}
      <ComponentCard
        title="Parcours Spirituel d'Assimilation des Âmes"
        desc="Progression à travers les 5 étapes fondamentales HSC"
        action={
          <Link href="/assimilation">
            <Button variant="outline" size="sm">
              <GitMerge className="w-3.5 h-3.5 mr-1" />
              Voir dans le Kanban
            </Button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {stages.map((stg, idx) => {
            const isPassed = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stg.key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-brand-500 bg-brand-50/60 dark:bg-brand-500/15 ring-2 ring-brand-500/20"
                    : isPassed
                    ? "border-success-200 bg-success-50/40 dark:border-success-500/20 dark:bg-success-500/5"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-800 dark:text-white">
                    {stg.label}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-success-600 dark:text-success-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{stg.desc}</p>
              </div>
            );
          })}
        </div>
      </ComponentCard>
    </div>
  );
}
