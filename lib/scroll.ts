// Custom silky-smooth easing scroll with controlled duration and header offset
// Implements the cubic ease-in-out engine specified in AGENTS.md & design.md

export function smoothScrollTo(targetY: number, duration: number = 850) {
  if (typeof window === 'undefined') return;

  const startY = window.scrollY || window.pageYOffset;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeInOutCubic(progress);

    window.scrollTo(0, startY + distance * easeProgress);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

export function scrollToElement(
  element: HTMLElement | null,
  duration: number = 850,
  offset: number = 116
) {
  if (!element || typeof window === 'undefined') return;
  const elementRect = element.getBoundingClientRect();
  const absoluteTop = elementRect.top + window.pageYOffset;
  const targetY = Math.max(0, absoluteTop - offset);
  smoothScrollTo(targetY, duration);
}

export function scrollToHash(
  hash: string,
  duration: number = 850,
  offset: number = 116
) {
  if (typeof window === 'undefined') return;
  const cleanId = hash.replace(/^#/, '');
  if (!cleanId) return;
  const element = document.getElementById(cleanId);
  if (element) {
    scrollToElement(element, duration, offset);
  }
}
