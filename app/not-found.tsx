import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--colors-canvas)] text-[var(--colors-ink)]">
      <h1 className="font-display text-4xl sm:text-6xl font-bold mb-4">404</h1>
      <p className="font-body text-sm text-[var(--colors-muted)] mb-8">
        The requested page could not be found.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg bg-[var(--colors-ink)] text-[var(--colors-canvas)] font-body font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Return Home
      </Link>
    </div>
  );
}
