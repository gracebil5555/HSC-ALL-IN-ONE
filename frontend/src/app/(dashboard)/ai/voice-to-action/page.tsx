"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Mic,
  Square,
  Play,
  CheckCircle2,
  Sparkles,
  Users,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Volume2,
} from "lucide-react";

export default function VoiceToActionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Simulation timer
  React.useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecord = () => {
    setIsRecording(true);
    setRecordDuration(0);
    setHasRecorded(false);
    setIsDone(false);
    setIsSynced(false);
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    setHasRecorded(true);
    setIsProcessing(true);

    // Simulate Whisper & LLM extraction
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 1400);
  };

  const handleSampleMemo = () => {
    setRecordDuration(42);
    setHasRecorded(true);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 800);
  };

  const handleConfirmSync = () => {
    setIsSynced(true);
  };

  const sampleTranscript =
    "« Shalom pasteur, ici Séraphin Mabiala pour le rapport de la Brigade David ce mardi à Mpita. Étaient présents : le frère Dieudonné Massamba, la sœur Bernice Moukassa et le frère Christian Bouesso. Par contre, nous signalons l'absence de Maman Koumba Véronique qui a été hospitalisée d'urgence à Loandjili ce matin pour hypertension. Une visite pastorale avec intercession est vivement souhaitée. Fin du rapport. »";

  const extractedAttendees = [
    { name: "Dieudonné Massamba", role: "Chantre", status: "Présent" },
    { name: "Bernice Moukassa", role: "Fidèle", status: "Présent" },
    { name: "Christian Bouesso", role: "Logistique", status: "Présent" },
  ];

  const extractedAlert = {
    member: "Maman Koumba Véronique",
    type: "Urgence Santé / Hospitalisation",
    location: "Hôpital Général de Loandjili",
    severity: "CRITICAL",
    action: "Visite pastorale et prière demandées",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Moteur Voice-to-Action (Pointage & Alertes par Note Vocale)"
        description="Transcription Whisper et extraction structurée LLM des présences et des alertes pastorales depuis un mémo audio"
        breadcrumbs={[
          { label: "Intelligence Artificielle" },
          { label: "Voice-to-Action" },
        ]}
      />

      {/* Recording Studio Card */}
      <Card className="text-center p-8 bg-gradient-to-b from-white to-brand-50/30 dark:from-gray-900 dark:to-gray-900/80 border-2 border-brand-100 dark:border-gray-800">
        <div className="max-w-md mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moteur d'Extraction Vocale HSC</span>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Enregistrement du Rapport de Brigade
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dictez les présences et les éventuels cas de maladie ou deuil. L'IA se charge du reste.
          </p>

          {/* Record Button & Wave animation */}
          <div className="py-6 flex flex-col items-center justify-center">
            {isRecording ? (
              <button
                onClick={handleStopRecord}
                className="w-24 h-24 rounded-full bg-error-500 text-white flex items-center justify-center shadow-theme-lg hover:scale-105 transition-all ring-8 ring-error-500/20 animate-pulse cursor-pointer"
              >
                <Square className="w-8 h-8 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleStartRecord}
                className="w-24 h-24 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-theme-lg hover:bg-brand-600 hover:scale-105 transition-all ring-8 ring-brand-500/20 cursor-pointer"
              >
                <Mic className="w-10 h-10" />
              </button>
            )}

            <div className="mt-4 font-mono text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>
                {Math.floor(recordDuration / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {(recordDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>

            {isRecording && (
              <span className="text-xs text-error-600 font-semibold mt-1 animate-pulse">
                ● Enregistrement audio en cours... Cliquez pour arrêter
              </span>
            )}
          </div>

          {!isRecording && !hasRecorded && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleSampleMemo}>
                <Volume2 className="w-4 h-4 mr-1.5 text-brand-500" />
                Charger le mémo vocal exemple (42 secondes)
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <div className="p-8 rounded-2xl border border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-500/10 text-center space-y-3">
          <div className="inline-block animate-spin text-brand-600">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-brand-900 dark:text-brand-300">
            Transcription Whisper & Détection sémantique en cours...
          </h3>
          <p className="text-xs text-brand-700/80 dark:text-brand-400">
            Extraction des présences d'émargement et qualification des alertes pastorales.
          </p>
        </div>
      )}

      {/* Output Results */}
      {isDone && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Transcript Preview */}
          <ComponentCard
            title="Transcription Audio (Whisper API)"
            desc="Texte intégral reconnu automatiquement avec horodatage"
          >
            <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl font-mono leading-relaxed border border-gray-100 dark:border-gray-700">
              {sampleTranscript}
            </p>
          </ComponentCard>

          {/* Structured LLM Output */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendees Detected */}
            <ComponentCard
              title="1. Présences Détectées (Pointage Émargement)"
              desc="3 membres identifiés et prêts à être émargés"
            >
              <div className="space-y-2">
                {extractedAttendees.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white block">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-gray-400">{att.role}</span>
                      </div>
                    </div>
                    <Badge variant="light" color="success" size="sm">
                      {att.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ComponentCard>

            {/* Alert Detected */}
            <ComponentCard
              title="2. Alerte Pastorale Qualifiée"
              desc="1 cas d'urgence critique détecté dans le mémo"
            >
              <div className="p-4 rounded-xl border border-error-200 bg-error-50/50 dark:border-error-500/20 dark:bg-error-500/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-error-700 dark:text-error-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{extractedAlert.type}</span>
                  </div>
                  <Badge variant="solid" color="error" size="sm">
                    CRITIQUE
                  </Badge>
                </div>

                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Fidèle :</strong> {extractedAlert.member}
                  </p>
                  <p>
                    <strong>Lieu :</strong> {extractedAlert.location}
                  </p>
                  <p>
                    <strong>Action requise :</strong> {extractedAlert.action}
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>

          {/* Confirmation Strip */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Validation & Injection en Base de Données
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Crée les fiches de présence dominicale et transmet l'alerte au pasteur de garde.
              </p>
            </div>

            {isSynced ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/15 px-4 py-2.5 rounded-xl border border-success-200 dark:border-success-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Synchronisé avec succès dans Django ORM !</span>
              </div>
            ) : (
              <Button variant="default" size="default" onClick={handleConfirmSync}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider en 1 Clic
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
