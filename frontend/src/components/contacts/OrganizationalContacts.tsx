"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { usersService } from "@/services/users.service";
import {
  membersService,
  DEFAULT_ECCLESIAL_FUNCTIONS,
  DEFAULT_MEMBER_STATUSES,
} from "@/services/members.service";
import { departmentsService, DepartmentItem } from "@/services/departments.service";
import { CurrentUser } from "@/types/auth.types";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  Send,
} from "lucide-react";

interface OrganizationalContactsProps {
  campusId?: string;
  isGlobalScope?: boolean;
}

export const OrganizationalContacts: React.FC<OrganizationalContactsProps> = ({
  campusId,
  isGlobalScope,
}) => {
  const [contacts, setContacts] = useState<(CurrentUser & { status?: string; status_display?: string; department_name?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [functionFilter, setFunctionFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [ecclesialFunctions, setEcclesialFunctions] = useState(DEFAULT_ECCLESIAL_FUNCTIONS);
  const [memberStatuses, setMemberStatuses] = useState(DEFAULT_MEMBER_STATUSES);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  useEffect(() => {
    membersService.getEcclesialFunctions().then((items) => {
      if (items.length > 0) setEcclesialFunctions(items.map((i) => ({ code: i.code, label: i.label })));
    });
    membersService.getMemberStatuses().then((items) => {
      if (items.length > 0) setMemberStatuses(items.map((i) => ({ code: i.code, label: i.label, color: i.color })));
    });
  }, []);

  useEffect(() => {
    departmentsService.getDepartments(campusId).then(setDepartments);
  }, [campusId]);

  useEffect(() => {
    async function fetchContacts() {
      setIsLoading(true);
      try {
        const data = await usersService.getContacts(campusId, {
          ecclesial_function: functionFilter,
          department_id: departmentFilter,
          status: statusFilter,
        });
        setContacts(data);
      } catch (e) {
        console.error("Erreur chargement contacts:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchContacts();
  }, [campusId, functionFilter, departmentFilter, statusFilter]);

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.ecclesial_function || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFilter === "PASTEURS") {
      return c.ecclesial_function === "PASTEUR" || c.ecclesial_function === "APOTRE";
    }
    if (activeFilter === "RESPONSABLES") {
      const fn = (c.ecclesial_function as string) || "";
      return c.role === "ADMIN_DEPT" || fn === "RESPONSABLE" || fn === "RESPONSABLE_DEPT";
    }
    if (activeFilter === "ADJOINTS") {
      return c.is_deputy || c.role === "ADJOINT";
    }
    if (activeFilter === "DIRIGEANTS") {
      return c.role === "SUPER_ADMIN" || c.role === "SUPER_SUPER_ADMIN";
    }

    return true;
  });

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              Carnet de Contacts
            </h3>
            <p className="text-[11px] text-gray-400">
              {isGlobalScope ? "Personnes clés du réseau mondial" : "Responsables, Officiers & Membres du campus"}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
          {filteredContacts.length} contacts
        </span>
      </div>

      {/* Barre de recherche */}
      <div className="pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, fonction, téléphone...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 focus:outline-hidden focus:border-brand-500"
          />
        </div>

        {/* Filtres avancés : Fonction ecclésiale, Département, Statut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <select
            value={functionFilter}
            onChange={(e) => setFunctionFilter(e.target.value)}
            className="h-7 px-2 text-[11px] rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">Fonction : Toutes</option>
            {(Array.isArray(ecclesialFunctions) ? ecclesialFunctions : []).map((f) => (
              <option key={f.code} value={f.code}>{f.label}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-7 px-2 text-[11px] rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">Dépt : Tous</option>
            {(Array.isArray(departments) ? departments : []).map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 px-2 text-[11px] rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">Statut : Tous</option>
            {(Array.isArray(memberStatuses) ? memberStatuses : []).map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="flex flex-wrap gap-1 pb-3 border-b border-gray-100 dark:border-gray-800">
        {[
          { key: "ALL", label: "Tous" },
          { key: "DIRIGEANTS", label: "Dirigeants" },
          { key: "PASTEURS", label: "Pasteurs" },
          { key: "RESPONSABLES", label: "Responsables" },
          { key: "ADJOINTS", label: "Adjoints" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              activeFilter === f.key
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste des contacts */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 space-y-1 mt-1 max-h-[460px] pr-1">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">Chargement des contacts…</div>
        ) : filteredContacts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">Aucun contact trouvé</div>
        ) : (
          (Array.isArray(filteredContacts) ? filteredContacts : []).map((contact) => {
            const cleanPhone = (contact.phone || "").replace(/[^0-9]/g, "");
            return (
              <div
                key={contact.id}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-brand-100 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800 shrink-0 flex items-center justify-center font-bold text-brand-700 dark:text-brand-300 text-xs">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.username} className="w-full h-full object-cover" />
                    ) : (
                      `${contact.first_name?.[0] || ""}${contact.last_name?.[0] || ""}`
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {contact.title ? `${contact.title} ` : ""}
                        {contact.first_name} {contact.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate">
                      <span className="text-brand-600 dark:text-brand-400 font-medium">
                        {contact.ecclesial_function_display || contact.ecclesial_function}
                      </span>
                      {contact.department_name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{contact.department_name}</span>
                        </>
                      )}
                      {contact.campus_name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{contact.campus_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/communications?recipient=${encodeURIComponent(
                      `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                    )}${contact.phone ? `&phone=${encodeURIComponent(contact.phone)}` : ""}${
                      (contact as any).department_id ? `&department_id=${(contact as any).department_id}` : ""
                    }`}
                    title="Message HSC (Communication)"
                    className="p-1.5 rounded-md text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Link>
                  {contact.phone ? (
                    <>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Envoyer un WhatsApp"
                        className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:${contact.phone}`}
                        title="Appeler"
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Pas de tél</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
