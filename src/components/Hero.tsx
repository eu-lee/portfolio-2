import { useRef } from "react";
import { BrickCanvas } from "./BrickCanvas";
import { useStudGrid } from "../lib/heroGrid";
import headerVideo from "../../media/bkg.mp4";

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
      <div className="hero-bio">
        <p>I study software engineering at the University of Waterloo.</p>
        <p>
          Feel free to reach out to me on{" "}
          <a href="https://www.linkedin.com/in/eu-lee/" target="_blank" rel="noreferrer">LinkedIn</a>
          {" "}or by <a href="mailto:eugene.lee@uwaterloo.ca">email</a>.
        </p>
      </div>
    </header>
  );
}
