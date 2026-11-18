"use client";

import React, { useState, useEffect } from "react";
import { ComponentCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { Member } from "@/types/member.types";
import {
  Music,
  Calendar,
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface RehearsalItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  songs: string;
  presentMemberIds: string[];
}

interface ChoraleRehearsalsWidgetProps {
  campusId?: string | number | null;
  members: Member[];
}

const DEFAULT_REHEARSALS: RehearsalItem[] = [
  {
    id: "reh-1",
    title: "Répétition Culte Dominical",
    date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    time: "15:00",
    location: "Sanctuaire Principal",
    songs: "Louange d'entrée, Adoration prophétique, Chant de communion",
    presentMemberIds: [],
  },
  {
    id: "reh-2",
    title: "Session Vocale & Harmonie",
    date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    time: "18:00",
    location: "Salle Annexe Chorale",
    songs: "Travail des pupitres Soprano/Alto/Ténor",
    presentMemberIds: [],
  },
];

export const ChoraleRehearsalsWidget: React.FC<ChoraleRehearsalsWidgetProps> = ({
  campusId,
  members,
}) => {
  const storageKey = `hsc_chorale_rehearsals_${campusId || "default"}`;

  const [rehearsals, setRehearsals] = useState<RehearsalItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("15:00");
  const [location, setLocation] = useState("Sanctuaire Principal");
  const [songs, setSongs] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRehearsals(parsed);
          return;
        }
      }
      setRehearsals(DEFAULT_REHEARSALS);
    } catch {
      setRehearsals(DEFAULT_REHEARSALS);
    }
  }, [storageKey]);

  const persist = (next: RehearsalItem[]) => {
    setRehearsals(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
    }
  };

  const handleAddRehearsal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const newItem: RehearsalItem = {
      id: `reh-${Date.now()}`,
      title: title.trim(),
      date,
      time: time || "15:00",
      location: location.trim() || "Sanctuaire",
      songs: songs.trim(),
      presentMemberIds: [],
    };
    const next = [newItem, ...rehearsals].sort((a, b) => a.date.localeCompare(b.date));
    persist(next);
    setTitle("");
    setSongs("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    persist(rehearsals.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleAttendance = (rehearsalId: string, memberId: string) => {
    const next = rehearsals.map((r) => {
      if (r.id !== rehearsalId) return r;
      const exists = r.presentMemberIds.includes(memberId);
      return {
        ...r,
        presentMemberIds: exists
          ? r.presentMemberIds.filter((id) => id !== memberId)
          : [...r.presentMemberIds, memberId],
      };
    });
    persist(next);
  };

  return (
    <ComponentCard
      title="Répétitions & Planning de la Chorale"
      desc="Programmation des répétitions, répertoire de chants et pointage de présence des chantres (Section 9)"
      action={
        <Button
          type="button"
          variant={isAdding ? "outline" : "default"}
          size="sm"
          onClick={() => setIsAdding((v) => !v)}
        >
          <Plus className="w-4 h-4 mr-1" />
          {isAdding ? "Fermer" : "Nouvelle Répétition"}
        </Button>
      }
    >
      <div className="space-y-4">
        {isAdding && (
          <form
            onSubmit={handleAddRehearsal}
            className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="rehTitle" className="text-xs" required>
                  Intitulé / Culte préparé
                </Label>
                <Input
                  id="rehTitle"
                  placeholder="Ex: Répétition Culte d'Action de Grâce"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rehLocation" className="text-xs">
                  Lieu
                </Label>
                <Input
                  id="rehLocation"
                  placeholder="Sanctuaire Principal"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="rehDate" className="text-xs" required>
                  Date
                </Label>
                <Input
                  id="rehDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rehTime" className="text-xs">
                  Heure
                </Label>
                <Input
                  id="rehTime"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="rehSongs" className="text-xs">
                  Programme de chants
                </Label>
                <Input
                  id="rehSongs"
                  placeholder="Ex: Saint-Esprit, Gloire à l'Agneau..."
                  value={songs}
                  onChange={(e) => setSongs(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="default" size="sm">
                Enregistrer la répétition
              </Button>
            </div>
          </form>
        )}

        {rehearsals.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            Aucune répétition planifiée. Cliquez sur « Nouvelle Répétition » pour commencer.
          </div>
        ) : (
          <div className="space-y-2.5">
            {(Array.isArray(rehearsals) ? rehearsals : []).map((reh) => {
              const isExpanded = expandedId === reh.id;
              const presentCount = reh.presentMemberIds.length;
              return (
                <div
                  key={reh.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] overflow-hidden"
                >
                  <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Music className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {reh.title}
                        </span>
                        <Badge variant="light" color="primary" size="sm">
                          {presentCount} / {members.length} présents
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {reh.date} · {reh.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {reh.location}
                        </span>
                      </div>
                      {reh.songs && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Répertoire :</span> {reh.songs}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px]"
                        onClick={() => setExpandedId(isExpanded ? null : reh.id)}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Présences
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 ml-1" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-error-600"
                        onClick={() => handleDelete(reh.id)}
                        title="Supprimer cette répétition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 p-3">
                      {members.length === 0 ? (
                        <p className="text-[11px] text-gray-400">
                          Aucun chantre ou musicien enregistré dans ce département.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {(Array.isArray(members) ? members : []).map((m) => {
                            const mid = String(m.id);
                            const isPresent = reh.presentMemberIds.includes(mid);
                            return (
                              <button
                                key={mid}
                                type="button"
                                onClick={() => toggleAttendance(reh.id, mid)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] border text-left transition-colors ${
                                  isPresent
                                    ? "bg-success-50 border-success-300 text-success-800 dark:bg-success-500/15 dark:border-success-500/40 dark:text-success-300 font-semibold"
                                    : "bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <span className="truncate">
                                  {m.first_name} {m.last_name}
                                </span>
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isPresent ? "text-success-600" : "text-gray-300"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ComponentCard>
  );
};
