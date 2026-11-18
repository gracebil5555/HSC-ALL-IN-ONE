"use client";

import React, { useEffect } from "react";
import { RefreshCw, Home, AlertCircle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur d'exécution de l'application:", error);

    // Si une erreur de chargement de chunk se produit après un déploiement Vercel,
    // on force un rechargement propre pour récupérer les nouveaux assets
    const msg = error?.message?.toLowerCase() || "";
    if (
      msg.includes("loading chunk") ||
      msg.includes("chunkloaderror") ||
      msg.includes("tostring") ||
      msg.includes("k.map")
    ) {
      const hasReloaded = sessionStorage.getItem("hsc_auto_reloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("hsc_auto_reloaded", "true");
        window.location.reload();
      }
    }
  }, [error]);

  const handleHardRefresh = () => {
    sessionStorage.removeItem("hsc_auto_reloaded");
    if (typeof window !== "undefined") {
      window.location.href = window.location.pathname + "?t=" + Date.now();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Mise à jour en cours ou session expirée
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Une nouvelle version du système a été déployée. Pour charger les nouveaux composants à jour, veuillez rafraîchir l'application.
          </p>
        </div>

        {error?.message && (
          <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800/60 text-[11px] font-mono text-gray-600 dark:text-gray-400 truncate max-w-full text-left">
            Détail : {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleHardRefresh}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger la version à jour
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/login";
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Connexion
          </button>
        </div>
      </div>
    </div>
  );
}
