"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour à la connexion</span>
      </Link>

      {/* Mobile Brand Header */}
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden bg-white p-1 border border-gray-200 dark:border-gray-700 shadow-theme-xs">
          <img
            src="/logo-hsc.jpg"
            alt="Logo HSC"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="font-bold text-gray-900 dark:text-white block">
            HSC Platform
          </span>
          <span className="text-[11px] text-gray-500">Église Hauts Standards</span>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Réinitialisation du mot de passe
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Entrez votre adresse email professionnelle liée à votre compte HSC.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-success-600 mx-auto" />
          <h3 className="text-sm font-semibold text-success-900 dark:text-success-300">
            Lien de réinitialisation envoyé
          </h3>
          <p className="text-xs text-success-700 dark:text-success-400">
            Si un compte correspond à <strong>{email}</strong>, les instructions de réinitialisation vous ont été transmises.
          </p>
          <Link href="/login" className="inline-block mt-2">
            <Button variant="outline" size="sm">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" required>
              Email enregistré
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@hsc-eglise.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              startIcon={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <Button type="submit" variant="default" className="w-full">
            Envoyer le lien de réinitialisation
          </Button>
        </form>
      )}
    </div>
  );
}
