import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { TenantProvider } from "@/context/TenantContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HSC Platform | Église Hauts Standards pour Christ",
  description: "Plateforme de gestion ecclésiale multi-sites de l'Église Hauts Standards pour Christ (HSC)",
  icons: {
    icon: "/logo-hsc.jpg",
    shortcut: "/logo-hsc.jpg",
    apple: "/logo-hsc.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={outfit.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('hsc-theme');
                  var pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var theme = saved || pref;
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-outfit min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-white/90 antialiased selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <TenantProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
