import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Arena01 — Futevôlei",
  description: "Sistema de gestão para a Arena01 Futevôlei. Agende aulas, faça check-in e acompanhe seu plano.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arena01",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#B8E000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ToastProvider>
          <ServiceWorkerRegistration />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

