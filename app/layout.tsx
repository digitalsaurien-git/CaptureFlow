import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaptureFlow",
  description: "Capture rapide et boite d'entree simple."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
