"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Search,
  MessageCircle,
  Phone,
  User,
  MapPin,
  CalendarDays
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { membersService } from "@/services/members.service";
import { Member } from "@/types/member.types";

export default function DirectoryPage() {
  const { currentCampusId } = useTenant();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      setIsLoading(true);
      try {
        const data = await membersService.getMembers(currentCampusId);
        setMembers(data);
      } catch (error) {
        console.error("Failed to load members directory", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, [currentCampusId]);

  const filtered = members.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search));
      
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Répertoire des Fidèles"
        description="Liste complète des membres enregistrés et de leurs contacts"
        breadcrumbs={[{ label: "Répertoire" }]}
      />

      {/* Search and Category Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher un membre, numéro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 shadow-theme-xs"
          >
            <option value="all">Tous les statuts</option>
            <option value="NOUVEAU">Nouveau Venu</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="SUSPENDU">Suspendu</option>
          </select>
        </div>
      </div>

      {/* Grid of Member Cards */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Chargement du répertoire...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Aucun membre trouvé.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => (
            <Card key={m.id} className="flex flex-col justify-between hover:shadow-theme-sm transition-shadow">
              <div>
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-50 border border-gray-200 shrink-0 flex items-center justify-center text-brand-600">
                    <User className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <Badge 
                      variant="light" 
                      color={m.status === 'ACTIF' ? 'success' : m.status === 'NOUVEAU' ? 'info' : 'warning'} 
                      size="sm" 
                      className="mb-1"
                    >
                      {m.status}
                    </Badge>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                      {m.first_name} {m.last_name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{m.phone || "Non renseigné"}</span>
                  </div>
                  {m.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      <span>Né(e) le {new Date(m.date_of_birth).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Contact Buttons */}
              <div className="flex items-center gap-2">
                {m.phone ? (
                  <>
                    <a
                      href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full"
                    >
                      <Button variant="success" size="sm" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        WhatsApp
                      </Button>
                    </a>
                    <a href={`tel:${m.phone}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full">
                        <Phone className="w-4 h-4 mr-1.5" />
                        Appeler
                      </Button>
                    </a>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Aucun contact
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
