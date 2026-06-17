import { BRAND } from "@cap/devroom-shared";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.full,
    short_name: BRAND.app,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c10",
    theme_color: "#11141a",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
