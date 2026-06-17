import { APP_VERSION, BRAND } from "@cap/devroom-shared";
import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui-loaded",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.pageTitle,
  description: BRAND.tagline,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND.app,
  },
  formatDetection: { telephone: false },
  other: {
    "cap-devroom-version": APP_VERSION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#11141a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${newsreader.variable} h-full`} data-theme="dark" suppressHydrationWarning>
      <body className="h-full" style={{ fontFamily: "var(--font-ui)" }}>
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
