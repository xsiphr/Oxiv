import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oxiv — Social Media Downloader",
  description:
    "Extract raw media effortlessly from TikTok, Instagram, Pinterest, and X. Clean, fast, and no watermark.",
  icons: {
    icon: "/logos/logomark-tab.svg",
    shortcut: "/logos/logomark-tab.svg",
    apple: "/logos/logomark-tab.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-[var(--colors-canvas)] text-[var(--colors-ink)] font-body antialiased selection:bg-[var(--colors-ink)] selection:text-[var(--colors-canvas)]">
        {children}
      </body>
    </html>
  );
}
