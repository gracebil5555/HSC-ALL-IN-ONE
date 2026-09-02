import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="relative flex min-h-screen w-full flex-col justify-center lg:flex-row">
        {/* Left Side: Auth Form Container */}
        <div className="flex w-full flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:px-12">
          {children}
        </div>

        {/* Right Side: TailAdmin Signature Brand Visual */}
        <div className="relative hidden w-full lg:flex lg:w-1/2 bg-brand-950 dark:bg-white/[0.03] items-center justify-center p-12 overflow-hidden border-l border-brand-900/50 dark:border-gray-800">
          {/* Subtle geometric circles and pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-auth" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-auth)" />
            </svg>
          </div>

          <div className="relative z-10 max-w-md text-center text-white flex flex-col items-center">
            <div className="flex items-center justify-center w-28 h-28 rounded-3xl bg-white p-3 shadow-theme-xl mb-6 ring-8 ring-brand-500/20 overflow-hidden">
              <img
                src="/logo-hsc.jpg"
                alt="Logo Église HSC"
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-3">
              Église Hauts Standards pour Christ
            </h2>

            <p className="text-sm text-brand-200/80 mb-8 leading-relaxed">
              Plateforme unifiée de gestion ecclésiale multi-sites, intendance des talents, assimilation des âmes et traçabilité des ressources du Royaume.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full text-left">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-brand-300 font-bold text-lg block">Phase 1</span>
                <span className="text-xs text-white/70">Siège Mondial Mpita & Extensions</span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-brand-300 font-bold text-lg block">Multi-Tenant</span>
                <span className="text-xs text-white/70">Isolation stricte & supervision globale</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
