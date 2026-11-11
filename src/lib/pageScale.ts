import { useEffect, useState } from "react";

// Mirrors --u in styles.css: scale 1 up to a 1512px window, then growing with
// width to a 1.25x maximum. Narrower windows keep scale 1; only the gutters and
// column-relative text shrink.
const referenceWidth = 1512;
const maxScale = 1.25;

export function getPageScale() {
  return Math.min(maxScale, Math.max(1, document.documentElement.clientWidth / referenceWidth));
}

export function usePageScale() {
  const [scale, setScale] = useState(getPageScale);
  useEffect(() => {
    const update = () => setScale(getPageScale());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}
