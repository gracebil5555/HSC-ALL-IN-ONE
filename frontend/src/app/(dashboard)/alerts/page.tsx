"use client";

import React, { useState } from "react";
import { useTenant } from "@/context/TenantContext";
import { PastoralAlert, AlertType, AlertSeverity, AlertStatus } from "@/types/alert.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  HeartHandshake,
  UserX,
  Phone,
  CheckCircle2,
  Clock,
  PlusCircle,
  UserCheck,
} from "lucide-react";

const INITIAL_ALERTS: PastoralAlert[] = [
  {
    id: "alt-01",
    member_name: "Maman Koumba Véronique",
    member_phone: "+242 06 612 00 11",
    residential_area: "Mpita Ravin",
    campus_id: "campus-mpita-hq",
    alert_type: "SANTE",
    severity: "CRITICAL",
    description: "Hospitalisée d'urgence à l'Hôpital Général de Loandjili (crise d'hypertension sévère). Visite pastorale et prière demandées.",
    reported_by_name: "Séraphin Mabiala (Chef Brigade David)",
    assigned_pastor_name: "Pasteur Alain Kimbembe",
    status: "ASSIGNED",
    created_at: "2026-09-02 08:30",
  },
  {
    id: "alt-02",
    member_name: "Famille Moukassa",
    member_phone: "+242 05 555 44 22",
    residential_area: "Tié-Tié",
    campus_id: "campus-mpita-hq",
    alert_type: "DEUIL",
    severity: "WARNING",
    description: "Rappel à Dieu de la mère de famille. Veillée de prière organisée au domicile familial ce vendredi.",
    reported_by_name: "Grace Mavoungou",
    assigned_pastor_name: "Pasteur Jean-Marc Ndalla",
    status: "OPEN",
    created_at: "2026-09-01 19:00",
  },
  {
    id: "alt-03",
    member_name: "Frère Yannick Loubaki",
    member_phone: "+242 06 987 65 43",
    residential_area: "Ngoyo",
    campus_id: "campus-ngoyo",
    alert_type: "DECROCHAGE",
    severity: "WARNING",
    description: "Absence inexpliquée aux 3 derniers cultes et répétitions de la chorale. Ne répond pas aux messages de groupe.",
    reported_by_name: "Dieudonné Massamba",
    assigned_pastor_name: null,
    status: "OPEN",
    created_at: "2026-08-31 11:20",
  },
  {
    id: "alt-04",
    member_name: "Sœur Prisca Mambou",
    member_phone: "+242 05 333 11 00",
    residential_area: "Paka",
    campus_id: "campus-paka",
    alert_type: "AIDE_MATERIELLE",
    severity: "INFO",
    description: "Difficultés temporaires de subsistance après perte d'emploi. Demande de soutien du diaconat.",
    reported_by_name: "Diacre Social",
    assigned_pastor_name: "Pasteur David Makosso",
    status: "RESOLVED",
    created_at: "2026-08-26 15:00",
  },
];

export default function AlertsPage() {
  const { currentCampusId, currentUser } = useTenant();
  const [alerts, setAlerts] = useState<PastoralAlert[]>(INITIAL_ALERTS);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);
  const [newMember, setNewMember] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newArea, setNewArea] = useState("Mpita");
  const [newType, setNewType] = useState<AlertType>("SANTE");
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>("WARNING");
  const [newDesc, setNewDesc] = useState("");

  const filtered = alerts.filter((a) => {
    const matchesCampus =
      currentCampusId === "all" ? true : a.campus_id === currentCampusId;
    const matchesStatus =
      statusFilter === "all" ? true : a.status === statusFilter;
    return matchesCampus && matchesStatus;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return <Badge variant="solid" color="error" size="sm">Urgence Critique</Badge>;
      case "WARNING":
        return <Badge variant="light" color="warning" size="sm">Important</Badge>;
      case "INFO":
        return <Badge variant="light" color="info" size="sm">Information</Badge>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="light" color="warning" size="sm">En attente</Badge>;
      case "ASSIGNED":
        return <Badge variant="light" color="primary" size="sm">Pris en charge</Badge>;
      case "RESOLVED":
        return <Badge variant="light" color="success" size="sm">Visité / Résolu</Badge>;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case "SANTE":
        return <HeartPulse className="w-4 h-4 text-error-500" />;
      case "DEUIL":
        return <AlertTriangle className="w-4 h-4 text-gray-700 dark:text-gray-300" />;
      case "DECROCHAGE":
        return <UserX className="w-4 h-4 text-warning-500" />;
      case "AIDE_MATERIELLE":
        return <HeartHandshake className="w-4 h-4 text-brand-500" />;
    }
  };

  const updateAlertStatus = (id: string, newStatus: AlertStatus) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: PastoralAlert = {
      id: `alt-${Date.now().toString().slice(-4)}`,
      member_name: newMember,
      member_phone: newPhone,
      residential_area: newArea,
      campus_id: currentCampusId === "all" ? "campus-mpita-hq" : currentCampusId,
      alert_type: newType,
      severity: newSeverity,
      description: newDesc,
      reported_by_name: `${currentUser.title} ${currentUser.last_name}`,
      assigned_pastor_name: "Pasteur Alain Kimbembe",
      status: "OPEN",
      created_at: new Date().toISOString().replace("T", " ").slice(0, 16),
    };
    setAlerts([newAlert, ...alerts]);
    setIsNewAlertOpen(false);
    setNewMember("");
    setNewPhone("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Console des Alertes Pastorales"
        description="Prise en charge des urgences hospitalières, deuils familiaux, soutien social et décrochages de culte"
        breadcrumbs={[{ label: "Alertes Pastorales" }]}
        action={
          <Button variant="destructive" size="default" onClick={() => setIsNewAlertOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Déclarer une Alerte
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-theme-xs">
        <span className="font-semibold px-2">Filtrer par statut :</span>
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            statusFilter === "all" ? "bg-brand-50 text-brand-600 font-bold dark:bg-brand-500/15" : ""
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setStatusFilter("OPEN")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            statusFilter === "OPEN" ? "bg-warning-50 text-warning-600 font-bold dark:bg-warning-500/15" : ""
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setStatusFilter("ASSIGNED")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            statusFilter === "ASSIGNED" ? "bg-brand-50 text-brand-600 font-bold dark:bg-brand-500/15" : ""
          }`}
        >
          Prises en charge
        </button>
        <button
          onClick={() => setStatusFilter("RESOLVED")}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            statusFilter === "RESOLVED" ? "bg-success-50 text-success-600 font-bold dark:bg-success-500/15" : ""
          }`}
        >
          Résolues / Visitées
        </button>
      </div>

      {/* Alerts Table */}
      <TableContainer>
        <TableHead>
          <TableHeaderCell>Sujet & Type</TableHeaderCell>
          <TableHeaderCell>Fidèle & Coordonnées</TableHeaderCell>
          <TableHeaderCell>Sévérité</TableHeaderCell>
          <TableHeaderCell>Détail de la Situation</TableHeaderCell>
          <TableHeaderCell>Pasteur Assigné</TableHeaderCell>
          <TableHeaderCell>Statut</TableHeaderCell>
          <TableHeaderCell className="text-right">Action Pastorale</TableHeaderCell>
        </TableHead>
        <TableBody>
          {filtered.map((alert) => (
            <TableRow key={alert.id}>
              {/* Type */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                    {getTypeIcon(alert.alert_type)}
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                      {alert.alert_type === "SANTE"
                        ? "Urgence Santé"
                        : alert.alert_type === "DEUIL"
                        ? "Deuil Familial"
                        : alert.alert_type === "DECROCHAGE"
                        ? "Décrochage Culte"
                        : "Aide Sociale"}
                    </span>
                    <span className="text-[10px] text-gray-400">{alert.created_at}</span>
                  </div>
                </div>
              </TableCell>

              {/* Member */}
              <TableCell>
                <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                  {alert.member_name}
                </span>
                <span className="text-[11px] text-gray-400 block">{alert.residential_area}</span>
                <a
                  href={`tel:${alert.member_phone}`}
                  className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3 h-3" />
                  {alert.member_phone}
                </a>
              </TableCell>

              {/* Severity */}
              <TableCell>{getSeverityBadge(alert.severity)}</TableCell>

              {/* Description */}
              <TableCell>
                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm">
                  {alert.description}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Signalé par : {alert.reported_by_name}
                </span>
              </TableCell>

              {/* Assigned Pastor */}
              <TableCell>
                {alert.assigned_pastor_name ? (
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {alert.assigned_pastor_name}
                  </span>
                ) : (
                  <span className="text-xs text-error-500 font-medium">Non assigné</span>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>{getStatusBadge(alert.status)}</TableCell>

              {/* Quick status change */}
              <TableCell className="text-right">
                {alert.status === "OPEN" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => updateAlertStatus(alert.id, "ASSIGNED")}
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Prendre en charge
                  </Button>
                )}
                {alert.status === "ASSIGNED" && (
                  <Button
                    variant="success"
                    size="sm"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => updateAlertStatus(alert.id, "RESOLVED")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Marquer Visité
                  </Button>
                )}
                {alert.status === "RESOLVED" && (
                  <span className="text-xs text-gray-400 font-medium">Clôturé</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableContainer>

      {/* New Alert Modal */}
      {isNewAlertOpen && (
        <Modal
          isOpen={isNewAlertOpen}
          onClose={() => setIsNewAlertOpen(false)}
          title="Déclarer une Alerte Pastorale d'Urgence"
          description="Transmission immédiate au collège pastoral pour prise en charge spirituelle ou matérielle"
        >
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div>
              <Label htmlFor="memName" required>
                Nom du fidèle ou de la famille
              </Label>
              <Input
                id="memName"
                placeholder="Ex: Frère Moïse, Famille Loubaki..."
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mPhone" required>
                  Téléphone / WhatsApp
                </Label>
                <Input
                  id="mPhone"
                  placeholder="+242 06 000 00 00"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="mArea" required>
                  Quartier
                </Label>
                <Input
                  id="mArea"
                  placeholder="Ex: Mpita, Ngoyo..."
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="aType" required>
                  Type d'urgence
                </Label>
                <Select
                  id="aType"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as AlertType)}
                >
                  <option value="SANTE">Urgence Santé / Hospitalisation</option>
                  <option value="DEUIL">Deuil Familial</option>
                  <option value="DECROCHAGE">Décrochage Culte</option>
                  <option value="AIDE_MATERIELLE">Aide Matérielle & Sociale</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="aSev" required>
                  Degré de gravité
                </Label>
                <Select
                  id="aSev"
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as AlertSeverity)}
                >
                  <option value="WARNING">Important (Sous 24h)</option>
                  <option value="CRITICAL">Critique (Visite Immédiate)</option>
                  <option value="INFO">Information Pastorale</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="aDesc" required>
                Circonstances & Besoins
              </Label>
              <Input
                id="aDesc"
                placeholder="Décrivez l'état de santé, le lieu d'hospitalisation, le besoin..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => setIsNewAlertOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="destructive">
                Diffuser l'alerte
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
