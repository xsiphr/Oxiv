# Oxiv

A minimal, watermark-free media extractor for TikTok and Pinterest — more platforms coming.

Paste a link, get the original file. No sign-up, no ads, no server-side storage.

**Live demo:** coming soon

---

## Status

| Platform | Status |
| :--- | :--- |
| TikTok | ✅ Live |
| Pinterest | ✅ Live |
| Facebook | 🔜 Next |
| Instagram | 🕓 Planned |
| X | 🕓 Planned |
| YouTube | 🕓 Planned |

---

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.

---

## Running Locally

```bash
git clone https://github.com/xsiphr/Oxiv.git
cd Oxiv
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000/).

---

## Architecture

- **Stateless:** No database, no server-side storage. Media is resolved and streamed directly to the browser.
- **Honest metrics:** No fake numbers. Every stat shown on the site reflects the real architecture, not a marketing figure.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contributing

Issues and pull requests are welcome.
