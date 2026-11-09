import { useRef } from "react";
import { BrickCanvas } from "./BrickCanvas";
import { useStudGrid } from "../lib/heroGrid";
import headerVideo from "../../media/bkg.mp4";

export function Hero({ showMedia = true }: { showMedia?: boolean }) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const grid = useStudGrid(mediaRef);

  return (
    <header className="hero">
      <div ref={mediaRef} className="hero-media">
        {showMedia && <BrickCanvas src={headerVideo} grid={grid} mediaDarken={0.3} slowdown={3} />}
        <div className="hero-intro">
          <h1 className="hero-name">Eugene Lee</h1>
        </div>
      </div>
      <div className="hero-bio">
        <p>I study Software Engineering at the University of Waterloo. I'm interested in math and algorithms.</p>
      </div>
    </header>
  );
}
