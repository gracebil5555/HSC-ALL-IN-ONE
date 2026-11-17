import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HSC Platform — Hauts Standards pour Christ",
    short_name: "HSC Platform",
    description:
      "Gestion ecclésiale multi-sites Hauts Standards pour Christ (Membres, Finances, Patrimoine, Assimilation).",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#1E3A8A",
    orientation: "portrait-primary",
    lang: "fr",
    icons: [
      {
        src: "/logo-hsc.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
