import type { Metadata } from "next";
import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oxiv — Social Media Downloader",
  description:
    "Extract raw media effortlessly from TikTok, Instagram, Pinterest, and X. Clean, fast, and no watermark.",
  icons: {
    icon: "/logos/logo-monolith-tab.svg",
    shortcut: "/logos/logo-monolith-tab.svg",
    apple: "/logos/logo-monolith-tab.svg",
  },
};

const themeAndLangScript = `(function() {
  try {
    var savedTheme = localStorage.getItem('oxiv_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.cookie = 'oxiv_theme=' + savedTheme + '; path=/; max-age=31536000; SameSite=Lax';
    }
    var savedLang = localStorage.getItem('oxiv_lang');
    if (savedLang === 'ar') {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
      document.cookie = 'oxiv_lang=ar; path=/; max-age=31536000; SameSite=Lax';
    } else if (savedLang === 'en') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
      document.cookie = 'oxiv_lang=en; path=/; max-age=31536000; SameSite=Lax';
    }
  } catch (e) {}
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedLang = cookieStore.get("oxiv_lang")?.value;
  const initialLocale: Locale = savedLang === "ar" ? "ar" : "en";
  const isAr = initialLocale === "ar";
  const initialTheme = cookieStore.get("oxiv_theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={initialLocale} dir={isAr ? "rtl" : "ltr"} data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <script
          id="theme-and-lang-init"
          dangerouslySetInnerHTML={{ __html: themeAndLangScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[var(--colors-canvas)] text-[var(--colors-ink)] font-body antialiased selection:bg-[var(--colors-ink)] selection:text-[var(--colors-canvas)]"
      >
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
