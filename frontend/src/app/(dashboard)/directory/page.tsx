"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Briefcase,
  Search,
  MessageCircle,
  Phone,
  MapPin,
  Building,
  Star,
  ExternalLink,
} from "lucide-react";

interface Entrepreneur {
  id: string;
  name: string;
  company_name: string;
  profession: string;
  category: "BTP & Immobilier" | "Santé & Pharmacie" | "Informatique & Tech" | "Commerce & Restauration" | "Services & Conseil";
  city: string;
  phone: string;
  whatsapp: string;
  description: string;
  avatar: string;
}

const MOCK_ENTREPRENEURS: Entrepreneur[] = [
  {
    id: "ent-01",
    name: "Prudence Nganga",
    company_name: "BTP Congo Propre",
    profession: "Ingénieur Génie Civil & Construction",
    category: "BTP & Immobilier",
    city: "Pointe-Noire (Mpita)",
    phone: "+242 06 555 77 88",
    whatsapp: "+242 06 555 77 88",
    description: "Travaux publics, réhabilitation de bâtiments, adduction d'eau et gros œuvre.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "ent-02",
    name: "Dr. Sandrine Moukila",
    company_name: "Pharmacie de la Grâce",
    profession: "Pharmacienne & Conseil Santé",
    category: "Santé & Pharmacie",
    city: "Pointe-Noire (Centre-Ville)",
    phone: "+242 05 600 22 11",
    whatsapp: "+242 05 600 22 11",
    description: "Délivrance de médicaments essentiels, conseils nutritionnels et assistance aux familles.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "ent-03",
    name: "Jonathan Mboungou",
    company_name: "Kongo Cloud Solutions",
    profession: "Développeur Fullstack & DevOps",
    category: "Informatique & Tech",
    city: "Pointe-Noire (Ngoyo)",
    phone: "+242 06 999 44 33",
    whatsapp: "+242 06 999 44 33",
    description: "Création de sites web, applications mobiles, intégration de passerelles Mobile Money (Airtel/MTN).",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "ent-04",
    name: "Chantal Goma",
    company_name: "Saveurs du Fleuve",
    profession: "Traiteur & Restauration Événementielle",
    category: "Commerce & Restauration",
    city: "Paris & Île-de-France",
    phone: "+33 6 12 34 56 78",
    whatsapp: "+33 6 12 34 56 78",
    description: "Buffets pour mariages chrétiens, collations d'églises et cuisine afro-fusion.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "ent-05",
    name: "Maître Serge Malonga",
    company_name: "Cabinet Juridique Alliance",
    profession: "Avocat d'Affaires & Conseil Fiscal",
    category: "Services & Conseil",
    city: "Pointe-Noire (Lumumba)",
    phone: "+242 05 777 88 99",
    whatsapp: "+242 05 777 88 99",
    description: "Création d'entreprises, rédaction de contrats commerciaux et conformité OHADA.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = MOCK_ENTREPRENEURS.filter((e) => {
    const query = search.toLowerCase();
    const matchesSearch =
      e.name.toLowerCase().includes(query) ||
      e.company_name.toLowerCase().includes(query) ||
      e.profession.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query);

    const matchesCat = category === "all" ? true : e.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annuaire des Métiers & Entrepreneurs HSC"
        description="Plateforme d'entraide économique et réseau professionnel entre fidèles de l'église"
        breadcrumbs={[{ label: "Annuaire Économique" }]}
      />

      {/* Search and Category Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher un métier, une entreprise, un frère..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-700 dark:text-gray-300 shadow-theme-xs"
          >
            <option value="all">Tous les secteurs d'activité</option>
            <option value="BTP & Immobilier">BTP & Immobilier</option>
            <option value="Santé & Pharmacie">Santé & Pharmacie</option>
            <option value="Informatique & Tech">Informatique & Tech</option>
            <option value="Commerce & Restauration">Commerce & Restauration</option>
            <option value="Services & Conseil">Services & Conseil</option>
          </select>
        </div>
      </div>

      {/* Grid of Entrepreneur Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ent) => (
          <Card key={ent.id} className="flex flex-col justify-between hover:shadow-theme-sm transition-shadow">
            <div>
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-50 border border-gray-200 shrink-0">
                  <img
                    src={ent.avatar}
                    alt={ent.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <Badge variant="light" color="primary" size="sm" className="mb-1">
                    {ent.category}
                  </Badge>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                    {ent.company_name}
                  </h3>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                    {ent.profession}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 leading-relaxed">
                {ent.description}
              </p>

              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span>Dirigeant : <strong>{ent.name}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{ent.city}</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${ent.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="success" size="sm" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-1.5" />
                  WhatsApp
                </Button>
              </a>
              <a href={`tel:${ent.phone}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full">
                  <Phone className="w-4 h-4 mr-1.5" />
                  Appeler
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
