"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { MOCK_BRIGADES } from "@/mocks/brigades.mock";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
  const { currentCampusId } = useTenant();
  const [brigades] = useState(MOCK_BRIGADES);

  const filtered =
    currentCampusId === "all"
      ? brigades
      : brigades.filter((b) => b.campus_id === currentCampusId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brigades & Groupes de Croissance (GDC)"
        description="Cellules de proximité, encadrement des fidèles, réunions hebdomadaires et pointage des présences"
        breadcrumbs={[{ label: "Brigades" }]}
        action={
          <Button variant="default" size="default">
            <PlusCircle className="w-4 h-4 mr-2" />
            Créer une Brigade
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((brigade) => (
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
                    <span className="text-xs text-gray-400">Siège Mpita</span>
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
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-100 dark:bg-gray-700 border border-gray-200 shrink-0">
                      {brigade.leader_avatar ? (
                        <img
                          src={brigade.leader_avatar}
                          alt={brigade.leader_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-brand-600">
                          {brigade.leader_name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-gray-800 dark:text-white block">
                        {brigade.leader_name}
                      </span>
                      <a
                        href={`tel:${brigade.leader_phone}`}
                        className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {brigade.leader_phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Meeting Details */}
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{brigade.meeting_schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{brigade.meeting_place}</span>
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
                  <span className="text-xl font-black text-success-600 dark:text-success-400 block">
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
                  Voir Effectif
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
    </div>
  );
}
