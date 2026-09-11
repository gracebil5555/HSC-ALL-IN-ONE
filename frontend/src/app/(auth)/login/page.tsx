"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { authService } from "@/services/auth.service";
import { Eye, EyeOff, Lock, Mail, Building2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, setCurrentCampusId } = useTenant();

  const [email, setEmail] = useState("roland.elenga@hsc-eglise.org");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Login to get JWT
      await authService.login(email, password);
      // Fetch user profile
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
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
          variant="default"
          size="default"
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
