"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { authService } from "@/services/auth.service";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useTenant();

  const [email, setEmail] = useState("roland.elenga@hsc-eglise.org");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Login to get JWT
      await authService.login(email.trim(), password);
      // Fetch user profile
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      const serverMsg = err?.response?.data?.detail || "Identifiants incorrects ou serveur indisponible. Veuillez vérifier vos accès.";
      setErrorMsg(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAccount = (identifiant: string, mdp: string) => {
    setEmail(identifiant);
    setPassword(mdp);
    setErrorMsg("");
  };

  return (
    <div className="mx-auto w-full max-w-md">
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

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white/90 mb-2">
          Connexion
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Accédez à la console de gestion ecclésiale multi-sites HSC.
        </p>
      </div>

      {/* Message d'erreur visible */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 text-error-700 dark:text-error-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-error-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
        <div>
          <Label htmlFor="email" required>
            Identifiant / Email
          </Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startIcon={<Mail className="w-4 h-4" />}
            placeholder="roland.elenga@hsc-eglise.org ou roland.elenga"
            required
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Mot de passe
          </Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startIcon={<Lock className="w-4 h-4" />}
            placeholder="Entrez votre mot de passe"
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 select-none">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
            />
            <span>Se souvenir de moi</span>
          </label>

          <Link
            href="/forgot-password"
            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 text-xs font-semibold"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button
          type="submit"
          variant="default"
          size="default"
          isLoading={isLoading}
          className="w-full py-3"
        >
          Se connecter
        </Button>
      </form>

      {/* Raccourcis de connexion rapide préconfigurés */}
      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
          Comptes de test préconfigurés :
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => selectAccount("roland.elenga@hsc-eglise.org", "Password123!")}
            className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/80 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all text-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block">Apôtre Roland ELENGA</span>
                <span className="text-[11px] text-gray-400">Super Super Admin · Réseau Global</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400">
              Password123!
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectAccount("chancel.niati@hsc-eglise.org", "12345678")}
            className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/80 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all text-xs flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block">Pasteur Chancel NIATI</span>
                <span className="text-[11px] text-gray-400">Super Admin · Mpita (Église Mère)</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              12345678
            </span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-400">
        <p>Connexion sécurisée par JWT · Multi-Tenancy Row-Level</p>
      </div>
    </div>
  );
}
