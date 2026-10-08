import { useRef } from "react";
import { BrickCanvas } from "./BrickCanvas";
import { useStudGrid } from "../lib/heroGrid";
import headerVideo from "../../bkg.mp4";

export function Hero() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const grid = useStudGrid(mediaRef);

  return (
    <header className="hero">
      <div ref={mediaRef} className="hero-media" role="img" aria-label="LEGO-style video header">
        <BrickCanvas src={headerVideo} grid={grid} mediaDarken={0.3} slowdown={2} />
      </div>
      <h1>Eugene</h1>
    </header>
  );
}
