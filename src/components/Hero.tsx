import { useRef } from "react";
import { BrickCanvas } from "./BrickCanvas";
import { SocialLinks } from "./SocialLinks";
import { useStudGrid } from "../lib/heroGrid";
import headerVideo from "../../bkg.mp4";

export function Hero() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const grid = useStudGrid(mediaRef);

  return (
    <header className="hero">
      <div ref={mediaRef} className="hero-media">
        <BrickCanvas src={headerVideo} grid={grid} mediaDarken={0.3} slowdown={3} />
        <div className="hero-intro">
          <h1 className="hero-name">Eugene Lee</h1>
        </div>
      </div>
      <div className="hero-details">
        <p className="hero-tagline">SE @ UWaterloo</p>
        <SocialLinks />
      </div>
    </header>
  );
}
