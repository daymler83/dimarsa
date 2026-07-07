import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dimarsa",
    short_name: "Dimarsa",
    description: "Plataforma de distribución digital para vendedores y catálogos compartibles.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#1B2A4A",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
