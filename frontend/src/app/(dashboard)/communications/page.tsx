"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRole } from "@/hooks/useRole";
import {
  communicationsService,
  MessageTemplateItem,
  CommunicationCampaignItem,
  MessageLogItem,
} from "@/services/communications.service";
import {
  membersService,
  DEFAULT_ECCLESIAL_FUNCTIONS,
  DEFAULT_MEMBER_STATUSES,
} from "@/services/members.service";
import { departmentsService, DepartmentItem } from "@/services/departments.service";
import { Member } from "@/types/member.types";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import {
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import {
  MessageSquare,
  Send,
  FileText,
  History,
  UserCheck,
  PlusCircle,
  Sparkles,
  Trash2,
} from "lucide-react";

type TabKey = "CAMPAIGNS" | "TEMPLATES" | "LOGS" | "CONSENTS";

export default function CommunicationsPage() {
  const { currentCampusId, currentUser, campuses } = useTenant();
  const { isSuperSuperAdmin, hasPermission } = useRole();

  const [activeTab, setActiveTab] = useState<TabKey>("CAMPAIGNS");
  const [templates, setTemplates] = useState<MessageTemplateItem[]>([]);
  const [campaigns, setCampaigns] = useState<CommunicationCampaignItem[]>([]);
  const [logs, setLogs] = useState<MessageLogItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [ecclesialFunctions, setEcclesialFunctions] = useState(DEFAULT_ECCLESIAL_FUNCTIONS);
  const [memberStatuses, setMemberStatuses] = useState(DEFAULT_MEMBER_STATUSES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedCampusId =
    currentCampusId && currentCampusId !== "all"
      ? currentCampusId
      : String(currentUser?.campus_id || campuses[0]?.id || "1");

  // Formulaire Campagne
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    template: "",
    channel: "SMS" as "SMS" | "WHATSAPP" | "BOTH",
    audience_type: "INACTIVE_MEMBERS",
    target_status: "INACTIF",
    target_ecclesial_function: "MEMBRE",
    target_department: "",
    include_deputies: true,
    custom_body: "",
  });

  // Formulaire Modèle
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "INVITATION",
    channel: "BOTH" as "SMS" | "WHATSAPP" | "BOTH",
    body: "Bonjour {first_name}, {campus_name} vous invite à notre prochain culte !",
    is_auto_welcome: false,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [tpls, cmps, lgs, mems, depts, funcs, stats] = await Promise.all([
      communicationsService.getTemplates(currentCampusId),
      communicationsService.getCampaigns(currentCampusId),
      communicationsService.getLogs(currentCampusId),
      membersService.getMembers(currentCampusId),
      departmentsService.getDepartments(resolvedCampusId),
      membersService.getEcclesialFunctions(),
      membersService.getMemberStatuses(),
    ]);
    setTemplates(tpls);
    setCampaigns(cmps);
    setLogs(lgs);
    setMembers(mems);
    setDepartments(depts);
    if (funcs.length > 0) setEcclesialFunctions(funcs.map((f) => ({ code: f.code, label: f.label })));
    if (stats.length > 0) setMemberStatuses(stats.map((s) => ({ code: s.code, label: s.label, color: s.color })));
    setIsLoading(false);
  }, [currentCampusId, resolvedCampusId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const recipient = params.get("recipient");
    const deptId = params.get("department_id");
    if (recipient || deptId) {
      setCampaignForm((prev) => ({
        ...prev,
        title: recipient ? `Message à ${recipient}` : prev.title,
        audience_type: deptId ? "BY_DEPARTMENT" : prev.audience_type,
        target_department: deptId || prev.target_department,
        channel: "WHATSAPP",
        custom_body: recipient ? `Bonjour ${recipient}, ` : prev.custom_body,
      }));
    }
  }, []);

  const handleSelectTemplateForCampaign = (templateId: string) => {
    const tpl = templates.find((t) => String(t.id) === templateId);
    setCampaignForm((prev) => ({
      ...prev,
      template: templateId,
      channel: tpl ? tpl.channel : prev.channel,
      custom_body: tpl ? tpl.body : prev.custom_body,
    }));
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title.trim() || (!campaignForm.custom_body.trim() && !campaignForm.template)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await communicationsService.createCampaign({
        campus: Number(resolvedCampusId),
        title: campaignForm.title.trim(),
        template: campaignForm.template ? Number(campaignForm.template) : null,
        channel: campaignForm.channel,
        audience_type: campaignForm.audience_type,
        target_status: campaignForm.audience_type === "BY_STATUS" ? campaignForm.target_status : "",
        target_ecclesial_function:
          campaignForm.audience_type === "BY_FUNCTION" ? campaignForm.target_ecclesial_function : "",
        target_department:
          campaignForm.audience_type === "BY_DEPARTMENT" && campaignForm.target_department
            ? Number(campaignForm.target_department)
            : null,
        include_deputies: campaignForm.include_deputies,
        custom_body: campaignForm.custom_body,
        send_now: true,
      });
      setCampaignForm((prev) => ({ ...prev, title: "", custom_body: "", template: "" }));
      await loadData();
    } catch (err) {
      console.error("Erreur envoi campagne:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.body.trim()) return;
    setIsSubmitting(true);
    try {
      await communicationsService.createTemplate({
        campus: isSuperSuperAdmin ? null : Number(resolvedCampusId),
        name: templateForm.name.trim(),
        category: templateForm.category,
        channel: templateForm.channel,
        body: templateForm.body,
        is_active: true,
        is_auto_welcome: templateForm.is_auto_welcome,
      });
      setTemplateForm({
        name: "",
        category: "INVITATION",
        channel: "BOTH",
        body: "Bonjour {first_name}, {campus_name} vous informe...",
        is_auto_welcome: false,
      });
      await loadData();
    } catch (err) {
      console.error("Erreur création modèle:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleConsent = async (member: Member, field: "sms_opt_in" | "whatsapp_opt_in", value: boolean) => {
    try {
      await membersService.updateMember(member.id, {
        [field]: value,
        unsubscribed_at: !value && !(field === "sms_opt_in" ? member.whatsapp_opt_in : member.sms_opt_in)
          ? new Date().toISOString()
          : null,
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, [field]: value } : m))
      );
    } catch (err) {
      console.error("Erreur mise à jour consentement:", err);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Relationnel — SMS & WhatsApp"
        description="Campagnes ciblées, scénarios automatiques de bienvenue, modèles réutilisables et gestion des consentements"
        breadcrumbs={[{ label: "Communications" }]}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Messages Journalisés"
          value={logs.length}
          subtitle="SMS & WhatsApp envoyés / simulés"
          icon={<MessageSquare className="w-6 h-6 text-brand-500" />}
          iconBgColor="bg-brand-50 dark:bg-brand-500/15"
        />
        <StatCard
          title="Campagnes Lancées"
          value={campaigns.length}
          subtitle="Envois groupés & relances"
          icon={<Send className="w-6 h-6 text-success-500" />}
          iconBgColor="bg-success-50 dark:bg-success-500/15"
        />
        <StatCard
          title="Modèles Actifs"
          value={templates.filter((t) => t.is_active).length}
          subtitle="Scénarios prêts à l'emploi"
          icon={<FileText className="w-6 h-6 text-info-500" />}
          iconBgColor="bg-blue-50 dark:bg-blue-500/15"
        />
        <StatCard
          title="Membres Opt-in WhatsApp"
          value={members.filter((m) => m.whatsapp_opt_in !== false && !m.unsubscribed_at).length}
          subtitle={`Sur ${members.length} fidèles du périmètre`}
          icon={<UserCheck className="w-6 h-6 text-warning-500" />}
          iconBgColor="bg-warning-50 dark:bg-warning-500/15"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        {[
          { key: "CAMPAIGNS", label: "Envoi Ciblé & Campagnes", icon: <Send className="w-4 h-4" /> },
          { key: "TEMPLATES", label: "Modèles de Messages", icon: <FileText className="w-4 h-4" /> },
          { key: "LOGS", label: "Historique des Envois", icon: <History className="w-4 h-4" /> },
          { key: "CONSENTS", label: "Consentements (Opt-in)", icon: <UserCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === "CAMPAIGNS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <ComponentCard
              title="Nouvel Envoi Ciblé"
              desc="Relancez les membres inactifs, nouveaux venus ou responsables de départements"
            >
              <form onSubmit={handleSendCampaign} className="space-y-4">
                <div>
                  <Label required>Titre de la campagne</Label>
                  <Input
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    placeholder="Ex: Relance culte dimanche / Réunion responsables"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Cible (Audience)</Label>
                    <Select
                      value={campaignForm.audience_type}
                      onChange={(e) => setCampaignForm({ ...campaignForm, audience_type: e.target.value })}
                    >
                      <option value="INACTIVE_MEMBERS">Membres inactifs</option>
                      <option value="NEW_MEMBERS">Nouveaux venus</option>
                      <option value="ALL_MEMBERS">Tous les membres</option>
                      <option value="LEADERS_AND_DEPUTIES">Responsables & Adjoints</option>
                      <option value="BY_STATUS">Par statut d'activité</option>
                      <option value="BY_FUNCTION">Par fonction ecclésiale</option>
                      <option value="BY_DEPARTMENT">Par département</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Canal d'envoi</Label>
                    <Select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value as any })}
                    >
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="BOTH">SMS & WhatsApp</option>
                    </Select>
                  </div>
                </div>

                {campaignForm.audience_type === "BY_STATUS" && (
                  <div>
                    <Label>Statut ciblé</Label>
                    <Select
                      value={campaignForm.target_status}
                      onChange={(e) => setCampaignForm({ ...campaignForm, target_status: e.target.value })}
                    >
                      {memberStatuses.map((s) => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {campaignForm.audience_type === "BY_FUNCTION" && (
                  <div>
                    <Label>Fonction ecclésiale ciblée</Label>
                    <Select
                      value={campaignForm.target_ecclesial_function}
                      onChange={(e) =>
                        setCampaignForm({ ...campaignForm, target_ecclesial_function: e.target.value })
                      }
                    >
                      {ecclesialFunctions.map((f) => (
                        <option key={f.code} value={f.code}>{f.label}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {campaignForm.audience_type === "BY_DEPARTMENT" && (
                  <div>
                    <Label>Département ciblé</Label>
                    <Select
                      value={campaignForm.target_department}
                      onChange={(e) => setCampaignForm({ ...campaignForm, target_department: e.target.value })}
                    >
                      <option value="">Sélectionner un département</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {campaignForm.audience_type === "LEADERS_AND_DEPUTIES" && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Inclure les adjoints de départements
                    </span>
                    <Toggle
                      checked={campaignForm.include_deputies}
                      onChange={(v) => setCampaignForm({ ...campaignForm, include_deputies: v })}
                    />
                  </div>
                )}

                <div>
                  <Label>Modèle réutilisable (Optionnel)</Label>
                  <Select
                    value={campaignForm.template}
                    onChange={(e) => handleSelectTemplateForCampaign(e.target.value)}
                  >
                    <option value="">Message personnalisé</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.channel})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label required>Contenu du message</Label>
                  <Textarea
                    rows={4}
                    value={campaignForm.custom_body}
                    onChange={(e) => setCampaignForm({ ...campaignForm, custom_body: e.target.value })}
                    placeholder="Variables : {first_name}, {last_name}, {full_name}, {campus_name}"
                    required
                  />
                </div>

                {hasPermission("creer") && (
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Envoi en cours..." : "Lancer l'envoi ciblé"}
                  </Button>
                )}
              </form>
            </ComponentCard>
          </div>

          <div className="lg:col-span-7">
            <ComponentCard title="Campagnes Récentes" desc="Suivi des envois groupés du périmètre">
              <TableContainer>
                <TableHead>
                  <TableHeaderCell>Campagne</TableHeaderCell>
                  <TableHeaderCell>Cible</TableHeaderCell>
                  <TableHeaderCell>Canal</TableHeaderCell>
                  <TableHeaderCell>Résultat</TableHeaderCell>
                  <TableHeaderCell>Statut</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                        Aucune campagne enregistrée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                            {c.title}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(c.created_at).toLocaleDateString("fr-FR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {c.audience_display || c.audience_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="light" color="info" size="sm">{c.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">
                            {c.sent_count}/{c.total_recipients}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="light"
                            color={c.status === "SENT" ? "success" : c.status === "FAILED" ? "error" : "warning"}
                            size="sm"
                          >
                            {c.status_display || c.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableContainer>
            </ComponentCard>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === "TEMPLATES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <ComponentCard title="Créer un Modèle" desc="Variables supportées : {first_name}, {campus_name}">
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <Label required>Nom du modèle</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Ex: Bienvenue Culte Dominical"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    >
                      <option value="BIENVENUE">Bienvenue</option>
                      <option value="INVITATION">Invitation</option>
                      <option value="RAPPEL">Rappel</option>
                      <option value="ANNIVERSAIRE">Anniversaire</option>
                      <option value="INFO_ACTIVITE">Info Activité</option>
                      <option value="RELANCE">Relance</option>
                      <option value="AUTRE">Autre</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Canal</Label>
                    <Select
                      value={templateForm.channel}
                      onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as any })}
                    >
                      <option value="SMS">SMS</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="BOTH">SMS & WhatsApp</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label required>Texte du modèle</Label>
                  <Textarea
                    rows={4}
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-white block">
                      Déclenchement automatique (Nouveau Venu)
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Envoyé automatiquement à l'inscription d'un nouveau venu
                    </span>
                  </div>
                  <Toggle
                    checked={templateForm.is_auto_welcome}
                    onChange={(v) => setTemplateForm({ ...templateForm, is_auto_welcome: v })}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Enregistrer le modèle
                </Button>
              </form>
            </ComponentCard>
          </div>

          <div className="lg:col-span-7">
            <ComponentCard title="Catalogue des Modèles" desc="Modèles globaux HSC et modèles du campus">
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {tpl.name}
                        </span>
                        <Badge variant="light" color="primary" size="sm">{tpl.category}</Badge>
                        <Badge variant="light" color="info" size="sm">{tpl.channel}</Badge>
                        {tpl.is_auto_welcome && (
                          <Badge variant="light" color="success" size="sm">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto-Bienvenue
                          </Badge>
                        )}
                      </div>
                      {(isSuperSuperAdmin || tpl.campus !== null) && (
                        <button
                          onClick={async () => {
                            await communicationsService.deleteTemplate(tpl.id);
                            loadData();
                          }}
                          className="p-1.5 text-gray-400 hover:text-error-600 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{tpl.body}</p>
                  </div>
                ))}
              </div>
            </ComponentCard>
          </div>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === "LOGS" && (
        <ComponentCard title="Historique des Messages" desc="Traçabilité complète des envois SMS & WhatsApp">
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Destinataire</TableHeaderCell>
              <TableHeaderCell>Canal</TableHeaderCell>
              <TableHeaderCell>Message rendu</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Horodatage</TableHeaderCell>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                    Aucun message journalisé pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-gray-900 dark:text-white block">
                        {log.recipient_name}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">{log.recipient_phone}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="light" color={log.channel === "WHATSAPP" ? "success" : "info"} size="sm">
                        {log.channel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 max-w-md">
                        {log.rendered_content}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="light"
                        color={log.status === "FAILED" ? "error" : log.status === "SIMULATED" ? "warning" : "success"}
                        size="sm"
                      >
                        {log.status_display || log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-gray-400">
                        {new Date(log.sent_at).toLocaleString("fr-FR")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableContainer>
        </ComponentCard>
      )}

      {/* TAB 4: CONSENTS */}
      {activeTab === "CONSENTS" && (
        <ComponentCard title="Gestion des Consentements (Opt-in / Désinscription)" desc="Préférences SMS et WhatsApp des fidèles">
          <TableContainer>
            <TableHead>
              <TableHeaderCell>Fidèle</TableHeaderCell>
              <TableHeaderCell>Téléphone</TableHeaderCell>
              <TableHeaderCell>Statut</TableHeaderCell>
              <TableHeaderCell>Opt-in SMS</TableHeaderCell>
              <TableHeaderCell>Opt-in WhatsApp</TableHeaderCell>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="font-semibold text-xs text-gray-900 dark:text-white">
                      {m.first_name} {m.last_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                      {m.phone || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="light" color="info" size="sm">
                      {m.status_display || m.status || "ACTIF"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Toggle
                      checked={m.sms_opt_in !== false && !m.unsubscribed_at}
                      onChange={(v) => handleToggleConsent(m, "sms_opt_in", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Toggle
                      checked={m.whatsapp_opt_in !== false && !m.unsubscribed_at}
                      onChange={(v) => handleToggleConsent(m, "whatsapp_opt_in", v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableContainer>
        </ComponentCard>
      )}
    </div>
  );
}
