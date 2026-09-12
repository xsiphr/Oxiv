<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logos/oxi-dark-mode.gif">
    <source media="(prefers-color-scheme: light)" srcset="public/logos/oxi-light-mode.gif">
    <img alt="Oxiv Mascot" src="public/logos/oxi.gif" width="140" height="140">
  </picture>
</p>

<h1 align="center">Oxiv</h1>

<p align="center">
  <strong>High-Precision, Watermark-Free Open Media Demuxer & Streaming Protocol</strong><br>
  Stateless • Lossless Bitstream • Zero Server Retention • Pure Client-Side Privacy
</p>

<p align="center">
  <a href="https://github.com/xsiphr/Oxiv"><img src="https://img.shields.io/badge/Next.js-15.1-18181b?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-18181b?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-3.4-18181b?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-18181b?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Retention-Zero%20Logs-18181b?style=flat-square" alt="Zero Logs">
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20AR%20(RTL)-18181b?style=flat-square" alt="Bilingual">
</p>

<p align="center">
  <a href="#highlights">Highlights</a> •
  <a href="#supported-platforms">Platforms</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a>
</p>

---

## Highlights

- **⚡ Lossless Bitstream Streaming** — Streams original CDN bytes unbuffered. No re-encoding, zero compression artifacts.
- **🛡️ 100% Client-Side Privacy** — Zero database, zero session cookies, zero server logging. Extraction history remains strictly in your browser (`localStorage`).
- **🚀 Zero Headless Scrapers** — No Puppeteer, Playwright, or paid third-party scraping APIs. Powered by native Node.js `fetch` and direct SSR hydration AST parsing.
- **📦 In-Browser Batch Packaging** — Bundles photo albums, slideshows, and multi-asset posts into ZIP archives client-side using `fflate`.
- **🌐 Full Bilingual Support** — Seamless English and Arabic (RTL) interface with zero layout shift.
- **📐 Monochrome Gridlines Aesthetic** — High-precision technical schematic interface, monospace telemetry, and responsive interactive SVG mascot (**Oxi**).

---

## Supported Platforms

| Platform | Status | Supported Formats | Extraction Capability |
| :--- | :---: | :--- | :--- |
| **TikTok** | `● Live` | Videos, Slideshows, Audio | Watermark-free 1080p MP4, full photo sets, 128kbps MP3 |
| **Pinterest** | `● Live` | Pins, Videos | Original high-res master JPEGs, 1080p MP4 |
| **Facebook** | `● Live` | Reels, Videos, Photos, Albums | Mobile shortlink resolution, PCB multi-photo sets, M4A DASH audio |
| **X (Twitter)** | `● Live` | Videos, GIFs, Master Photos | Progressive MP4 bitrate ladder (1080p–360p), 4K orig photos, quoted fallback |
| **Instagram** | `○ Planned` | Reels, Posts, Carousels | Pipeline in development |
| **YouTube** | `○ Planned` | Shorts, Videos, Audio | Pipeline in development |

---

## Architecture

Oxiv acts as an unbuffered pass-through demuxer between social platform content delivery networks and your browser:

```
  ┌──────────────────┐
  │   User Input     │  URL validation & platform identification
  └─────────┬────────┘
            ▼
  ┌──────────────────┐
  │  SSR AST Demux   │  Cookie-free hydration payload traversal (Node fetch)
  └─────────┬────────┘
            ▼
  ┌──────────────────┐
  │  Streaming Pipe  │  Unbuffered reverse proxy bypasses CORS & hotlinking
  └─────────┬────────┘
            ▼
  ┌──────────────────┐
  │ Lossless Output  │  Pristine MP4 / Master JPEG / Client ZIP
  └──────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18.18+
- npm, pnpm, or yarn

### Setup

```bash
# 1. Clone repository
git clone https://github.com/xsiphr/Oxiv.git
cd Oxiv

# 2. Install dependencies
npm install

# 3. Launch local dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
```

---

## Project Structure

```
Oxiv/
├── app/
│   ├── api/
│   │   ├── extract/route.ts       # Central POST endpoint for media demuxing
│   │   └── download/route.ts      # Unbuffered streaming reverse proxy
│   ├── about/                     # Documentation routes (Manifesto, Platforms, FAQ)
│   ├── activity/                  # Public Git commit ledger and heatmap
│   ├── recents/                   # Client-side extraction history manager
│   ├── settings/                  # User preferences (Theme, Language, Cache)
│   ├── support/                   # Minimal mascot showcase & coffee support
│   └── page.tsx                   # Main SPA downloader interface
├── components/
│   ├── media/
│   │   └── MediaPreview.tsx       # Media inspector, carousel & ZIP packager
│   ├── ui/
│   │   ├── ExtractionInput.tsx    # Primary URL ingestion bar & platform pills
│   │   ├── MegaMenu.tsx           # Monochrome Gridlines navigation popover
│   │   ├── Navbar.tsx             # Sticky header with active indicators
│   │   ├── Oxi.tsx                # Living interactive geometric mascot
│   │   └── TerminalStream.tsx     # Live monospace telemetry terminal
│   └── effects/                   # Ambient tickers & logo marquee loops
├── lib/
│   ├── extractors/                # Dedicated platform parsers (TikTok, Pinterest, FB, X)
│   ├── i18n/                      # Bilingual dictionaries & context (EN / AR)
│   ├── platformRegistry.ts        # Single source of truth for platform routing
│   └── zip.ts                     # In-memory browser ZIP compression engine
└── types/                         # TypeScript interfaces and media definitions
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, React 19) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS 3.4 + Scoped CSS Variables (Monochrome Gridlines) |
| **Compression** | `fflate` (In-memory client-side ZIP packaging) |
| **Icons** | `lucide-react`, `react-icons` |
| **Analytics** | `@vercel/analytics` (Privacy-first, cookie-less site metrics) |

---

## License

Distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See [LICENSE](LICENSE) for more information.
