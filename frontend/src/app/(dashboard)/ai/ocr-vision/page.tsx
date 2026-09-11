"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, ComponentCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableContainer, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import {
  ScanLine,
  UploadCloud,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Eye,
  Camera,
  Layers,
} from "lucide-react";

export default function OcrVisionPage() {
  const [hasUploaded, setHasUploaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const sampleRoster = [
    { id: 1, name: "Dieudonné Massamba", department: "Chantres", signature: true, detected: true, confidence: 99 },
    { id: 2, name: "Bernice Moukassa", department: "Chantres", signature: true, detected: true, confidence: 98 },
    { id: 3, name: "Yannick Loubaki", department: "Médias", signature: false, detected: false, confidence: 95 },
    { id: 4, name: "Prudence Nganga", department: "Protocole", signature: true, detected: true, confidence: 97 },
    { id: 5, name: "Moïse Mampassi", department: "Protocole", signature: true, detected: true, confidence: 99 },
  ];

  const handleSimulateScan = () => {
    setHasUploaded(true);
    setIsScanning(true);
    setIsSynced(false);

    setTimeout(() => {
      setIsScanning(false);
      setIsScanned(true);
    }, 1200);
  };

  const handleConfirmSync = () => {
    setIsSynced(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Reconnaissance Optique OCR Vision (Émargement Papier)"
        description="Numérisation et extraction automatique des présences manuscrites des répétitions et cultes"
        breadcrumbs={[
          { label: "Intelligence Artificielle" },
          { label: "OCR Émargement" },
        ]}
      />

      {/* Upload Zone */}
      <Card className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center hover:border-brand-500 transition-colors">
        <div className="max-w-md mx-auto space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 flex items-center justify-center">
            <ScanLine className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Téléverser la Feuille d'Émargement Manuscrite
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Prenez en photo la fiche papier des répétitions ou du culte dominical.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="default" size="default" onClick={handleSimulateScan}>
              <UploadCloud className="w-4 h-4 mr-2" />
              Simuler l'Envoi d'une Fiche Papier
            </Button>
          </div>
        </div>
      </Card>

      {/* Scanning Indicator */}
      {isScanning && (
        <div className="p-8 rounded-2xl border border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-500/10 text-center space-y-3">
          <div className="inline-block animate-spin text-brand-600">
            <RefreshCw className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-brand-900 dark:text-brand-300">
            Modèle Vision en cours d'analyse (Worker Celery)...
          </h3>
          <p className="text-xs text-brand-700/80 dark:text-brand-400">
            Détection des signatures, cases cochées et mise en correspondance avec l'annuaire des membres.
          </p>
        </div>
      )}

      {/* OCR Results & Confirmation Screen */}
      {isScanned && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ComponentCard
            title="Résultat de la Reconnaissance Optique"
            desc="Fiche émargement Répétition Chantres · 4 présents / 1 absent détectés avec 98% de confiance"
            action={
              <Badge variant="solid" color="success" size="md">
                Indice de Confiance : 98.2%
              </Badge>
            }
          >
            <TableContainer>
              <TableHead>
                <TableHeaderCell>Nom du Fidèle</TableHeaderCell>
                <TableHeaderCell>Département</TableHeaderCell>
                <TableHeaderCell>Détection Signature</TableHeaderCell>
                <TableHeaderCell>Statut Présence</TableHeaderCell>
                <TableHeaderCell className="text-right">Confiance IA</TableHeaderCell>
              </TableHead>
              <TableBody>
                {sampleRoster.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-gray-900 dark:text-white">
                        {row.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {row.department}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.signature ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-success-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Signature manuscrite validée
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Case vide</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.detected ? (
                        <Badge variant="light" color="success" size="sm">
                          Présent
                        </Badge>
                      ) : (
                        <Badge variant="light" color="error" size="sm">
                          Absent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                        {row.confidence}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </ComponentCard>

          {/* 1-Click Validation Banner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-theme-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Validation Finale de l'Émargement
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Synchronise les 4 pointages dans le module Membres et Departements.
              </p>
            </div>

            {isSynced ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/15 px-4 py-2.5 rounded-xl border border-success-200 dark:border-success-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span>Émargement enregistré avec succès en base !</span>
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
