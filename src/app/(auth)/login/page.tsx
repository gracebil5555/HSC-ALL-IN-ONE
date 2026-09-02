"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { MOCK_USERS } from "@/mocks/campuses.mock";
import { Eye, EyeOff, Lock, Mail, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, setCurrentCampusId } = useTenant();

  const [email, setEmail] = useState("roland.elenga@hsc-eglise.org");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
  };

  const handleFastLogin = (userKey: keyof typeof MOCK_USERS) => {
    const user = MOCK_USERS[userKey];
    setCurrentUser(user);
    if (user.campus_id) {
      setCurrentCampusId(user.campus_id);
    } else {
      setCurrentCampusId("all");
    }
    setEmail(user.email);
    router.push("/dashboard");
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

      {/* Demo Fast Logins */}
      <div className="mb-6 p-3.5 rounded-xl bg-brand-50/70 border border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Accès Rapide Démo (RBAC) :</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleFastLogin("apostle")}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-400 text-left transition-colors cursor-pointer shadow-theme-xs"
          >
            <span className="font-semibold block text-gray-800 dark:text-white truncate">Apôtre Roland G.</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400">Super-Super Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleFastLogin("pastor_mpita")}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-400 text-left transition-colors cursor-pointer shadow-theme-xs"
          >
            <span className="font-semibold block text-gray-800 dark:text-white truncate">Pasteur Alain K.</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400">Pasteur Mpita</span>
          </button>
          <button
            type="button"
            onClick={() => handleFastLogin("treasurer")}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-400 text-left transition-colors cursor-pointer shadow-theme-xs"
          >
            <span className="font-semibold block text-gray-800 dark:text-white truncate">Grace Mavoungou</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400">Gestion Caisse</span>
          </button>
          <button
            type="button"
            onClick={() => handleFastLogin("brigade_leader")}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-400 text-left transition-colors cursor-pointer shadow-theme-xs"
          >
            <span className="font-semibold block text-gray-800 dark:text-white truncate">Séraphin Mabiala</span>
            <span className="text-[10px] text-brand-600 dark:text-brand-400">Chef de Brigade</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
        <div>
          <Label htmlFor="email" required>
            Identifiant / Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startIcon={<Mail className="w-4 h-4" />}
            placeholder="nom.prenom@hsc-eglise.org"
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
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full py-3"
        >
          Se connecter
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Connexion sécurisée par JWT · Multi-Tenancy Row-Level</p>
      </div>
    </div>
  );
}
