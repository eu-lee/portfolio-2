import { useLayoutEffect, useSyncExternalStore } from "react";

// The page is designed at scale 1 for windows up to this width (a 14" MacBook
// Pro). Wider and taller windows scale everything up proportionally; smaller
// windows keep scale 1 and only the side gutters and column-relative text shrink.
const referenceWidth = 1512;

let scale = 1;
const listeners = new Set<() => void>();

function setScale(next: number) {
  if (Math.abs(next - scale) < 0.0005) return;
  scale = next;
  document.documentElement.style.setProperty("--u", `${next}px`);
  listeners.forEach((listener) => listener());
}

export function getPageScale() {
  return scale;
}

export function usePageScale() {
  return useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, getPageScale);
}

// Scale by the tighter of width and height so the homepage grows until it fills
// the window top to bottom without overflowing sideways.
export function usePageScaleController() {
  useLayoutEffect(() => {
    const homepage = document.querySelector<HTMLElement>(".homepage-content");
    const content = document.querySelector<HTMLElement>(".page-content");
    const footer = document.querySelector<HTMLElement>(".site-footer");
    if (!homepage || !content || !footer) return undefined;

    const update = () => {
      // Every length above scale 1 is linear in --u, so dividing by the current
      // scale gives the homepage's natural height at scale 1.
      const footerExtent = footer.getBoundingClientRect().bottom - content.getBoundingClientRect().bottom;
      const naturalHeight = (homepage.offsetHeight + footerExtent) / scale;
      const width = document.documentElement.clientWidth;
      setScale(Math.max(1, Math.min(width / referenceWidth, window.innerHeight / naturalHeight)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(homepage);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
}
