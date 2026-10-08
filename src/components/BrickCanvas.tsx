import { useEffect, useRef, useState } from "react";
import { mixColor, type LegoColor } from "../data/legoColors";
import type { StudGrid } from "../lib/heroGrid";

type StudTint = Pick<LegoColor, "value" | "alpha">;
type VideoFrameElement = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (time: number) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

type BrickCanvasProps = {
  src: string;
  grid: StudGrid | null;
  panStuds?: number;
  focalX?: number;
  focalY?: number;
  mediaDarken?: number;
  slowdown?: number;
};

function canvasContext(canvas: HTMLCanvasElement, options?: CanvasRenderingContext2DSettings) {
  const ctx = canvas.getContext("2d", options);
  if (!ctx) {
    throw new Error("Could not create 2D canvas context");
  }
  return ctx;
}

// Deterministic, position-locked surface variation so the field reads as real
// plastic rather than flat CGI. Independent of the source image => fine grain.
function surfaceJitter(x: number, y: number) {
  const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return h - Math.floor(h) - 0.5; // [-0.5, 0.5]
}

// Each stud is tinted with the actual color sampled from the source image, so
// the wall reproduces the photo's full range rather than a fixed palette. The
// tint is quantized to 8 steps per channel only to bound the sprite cache: a
// downsampled image resolves to a few hundred distinct tints, indistinguishable
// from the exact sample but cheap to cache and redraw.
const quantizeChannel = (n: number) => n & 0xf8;
function quantizeHex(r: number, g: number, b: number): `#${string}` {
  const packed =
    (1 << 24) + (quantizeChannel(r) << 16) + (quantizeChannel(g) << 8) + quantizeChannel(b);
  return `#${packed.toString(16).slice(1)}`;
}

function drawStud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: StudTint) {
  const alpha = color.alpha ?? 1;

  // --- Base plate: darker than the raised stud top. ---
  ctx.fillStyle = mixColor(color, -0.12, alpha);
  ctx.fillRect(x, y, size, size);

  const plateShade = ctx.createLinearGradient(x, y, x + size, y + size);
  plateShade.addColorStop(0, "rgba(255,255,255,0.11)");
  plateShade.addColorStop(0.5, "rgba(255,255,255,0)");
  plateShade.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = plateShade;
  ctx.fillRect(x, y, size, size);

  // --- Inter-brick seam (ambient occlusion in the gap). Each side is drawn as
  //     a single combined path filled once, so the bottom/right strips don't
  //     double-darken where they overlap at the corner — which is what made
  //     the points where four studs meet clump up dark. ---
  const groove = Math.max(1, size * 0.05);
  const lit = groove * 0.7;
  ctx.fillStyle = "rgba(0,0,0,0.32)"; // shadow side: bottom + right
  ctx.beginPath();
  ctx.rect(x, y + size - groove, size, groove);
  ctx.rect(x + size - groove, y, groove, size);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.14)"; // lit side: thin top + left catch
  ctx.beginPath();
  ctx.rect(x, y, size, lit);
  ctx.rect(x, y, lit, size);
  ctx.fill();

  // --- Stud geometry ---
  const topR = size * 0.31; // true LEGO 5mm/8mm => 0.625 diameter
  const wallH = size * 0.07; // visible cylinder wall (slight top-down view)
  const cx = x + size / 2;
  // Lift the stud slightly above the cell center. The cast shadow and wall
  // crescent both add dark weight below the disc, so a dead-center top face
  // reads as low; this nudge balances the composition optically.
  const cy = y + size / 2 - size * 0.05;

  // --- Cast shadow on the plate: a tight contact shadow tucked under the
  //     stud's lower-right. Kept small so it fades before the corner/seam and
  //     doesn't pool into a dark spot where bricks meet. ---
  const shx = cx + size * 0.05; // nudged toward the bottom-right, with the light
  const shy = cy + wallH + size * 0.065;
  const shadow = ctx.createRadialGradient(shx, shy, topR * 0.15, shx, shy, topR * 1.12);
  shadow.addColorStop(0, "rgba(0,0,0,0.52)");
  shadow.addColorStop(0.65, "rgba(0,0,0,0.2)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(shx, shy, topR * 1.12, topR * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Cylinder wall: a body circle dropped below the top face shows as a
  //     directional crescent at the bottom (dark on the shadow side). ---
  const wall = ctx.createLinearGradient(cx - topR, cy, cx + topR, cy + wallH);
  wall.addColorStop(0, mixColor(color, -0.18, alpha));
  wall.addColorStop(0.5, mixColor(color, -0.38, alpha));
  wall.addColorStop(1, mixColor(color, -0.58, alpha));
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.arc(cx, cy + wallH, topR, 0, Math.PI * 2);
  ctx.fill();

  // --- Top face: flat, and lighter than the recessed base plate so the
  //     raised circle reads as a distinct molded disc. ---
  ctx.fillStyle = mixColor(color, 0.1, alpha);
  ctx.beginPath();
  ctx.arc(cx, cy, topR, 0, Math.PI * 2);
  ctx.fill();

  // Matte diffuse: a single light from the top-left grades the flat top from
  // lit (upper-left) to shadowed (lower-right). No specular — fully matte.
  const topFace = ctx.createLinearGradient(cx - topR, cy - topR, cx + topR, cy + topR);
  topFace.addColorStop(0, "rgba(255,255,255,0.16)");
  topFace.addColorStop(0.5, "rgba(255,255,255,0)");
  topFace.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = topFace;
  ctx.beginPath();
  ctx.arc(cx, cy, topR, 0, Math.PI * 2);
  ctx.fill();

  // Molded top edge ring (defines the flat circular rim).
  ctx.lineWidth = Math.max(1, size * 0.028);
  ctx.strokeStyle = mixColor(color, -0.46, 0.62);
  ctx.beginPath();
  ctx.arc(cx, cy, topR - ctx.lineWidth * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, topR, 0, Math.PI * 2);
  ctx.clip();

  // --- Embossed LEGO wordmark (matte relief from the same top-left light). ---
  if (size >= 9) {
    ctx.translate(cx, cy);
    ctx.scale(0.66, 1.7);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(3, size * 0.155)}px Arial, sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.26)"; // shadow toward lower-right
    ctx.fillText("LEGO", size * 0.012, size * 0.014);
    ctx.fillStyle = "rgba(255,255,255,0.24)"; // catch toward upper-left
    ctx.fillText("LEGO", -size * 0.012, -size * 0.014);
    ctx.fillStyle = mixColor(color, 0.08, alpha); // face of the letters
    ctx.fillText("LEGO", 0, 0);
  }
  ctx.restore();
}

// Renders `src` as a wall of LEGO studs: the image is downsampled so each stud
// covers one source region, and the stud is tinted with that region's average
// color. Video frames redraw at up to 24 fps. The grid is measured by the hero
// and covers its container, which clips any overflow at the rounded edges.
export function BrickCanvas({
  src,
  grid,
  panStuds = 0,
  focalX = 0.5,
  focalY = 0.5,
  mediaDarken = 0,
  slowdown = 1
}: BrickCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  // One detailed stud rendered per (quantized) tint, reused across the wall and
  // across redraws; only rebuilt when the stud size or DPR changes.
  const spriteRef = useRef<{ cache: Map<string, HTMLCanvasElement>; key: string }>({ cache: new Map(), key: "" });
  const [ready, setReady] = useState(false);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [src]);

  // Start playback as soon as the element exists — NOT gated on `ready`. Mobile
  // Safari ignores `preload` and won't fetch/decode any video data until
  // playback is requested, so gating play() on the loadeddata event deadlocks
  // there: no data -> no `ready` -> no play() -> no data, and the wall stays
  // black. Calling play() is itself what makes the data (and loadeddata)
  // arrive. Two more mobile-autoplay accommodations: React sets the `muted`
  // DOM property but never renders the attribute (facebook/react#10389), so
  // re-assert the muted state explicitly before asking to play; and if the
  // policy still refuses (iOS Low Power Mode, Android data saver), retry on
  // the first user gesture instead of giving up.
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return undefined;
    video.defaultMuted = true;
    video.muted = true;
    let disposed = false;
    const onGesture = () => {
      if (!disposed) tryPlay();
    };
    const tryPlay = () => {
      video.play().catch(() => {
        if (disposed) return;
        // pointerup (not pointerdown) is what grants the transient user
        // activation play() needs; keydown covers keyboard-only visitors.
        window.addEventListener("pointerup", onGesture, { once: true });
        window.addEventListener("keydown", onGesture, { once: true });
      });
    };
    tryPlay();
    return () => {
      disposed = true;
      window.removeEventListener("pointerup", onGesture);
      window.removeEventListener("keydown", onGesture);
      video.pause();
    };
  }, [src]);

  // Preserve the original header playback speed.
  useEffect(() => {
    const video = videoElementRef.current;
    if (!video) return;
    video.playbackRate = 1 / Math.max(1, slowdown);
  }, [ready, slowdown]);

  // Resample each video frame into the original LEGO stud grid.
  useEffect(() => {
    const media = videoElementRef.current;
    const sourceSize = { width: media?.videoWidth ?? 0, height: media?.videoHeight ?? 0 };
    if (!grid || !ready || !media || sourceSize.width === 0 || sourceSize.height === 0) return;

    const { columns, rows, cell, deviceWidth, deviceHeight } = grid;
    if (deviceWidth === 0 || deviceHeight === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvasContext(canvas);
    if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
      canvas.width = deviceWidth;
      canvas.height = deviceHeight;
    }
    // Draw straight in device pixels: `cell` is a whole number of them and every
    // stud sits at x*cell / y*cell, so the wall tiles seamlessly (no azure bleed)
    // and blits 1:1 with no resampling. Smoothing off as belt-and-suspenders.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;

    function getSprite(hex: `#${string}`) {
      const cached = spriteRef.current.cache.get(hex);
      if (cached) return cached;
      const off = document.createElement("canvas");
      off.width = cell;
      off.height = cell;
      const octx = canvasContext(off);
      drawStud(octx, 0, 0, cell, { value: hex, alpha: 1 });
      spriteRef.current.cache.set(hex, off);
      return off;
    }

    // Offscreen buffer that downsamples the source image to the stud grid; the
    // browser averages each source region for us as it scales the draw down.
    const sampler = document.createElement("canvas");
    const sctx = canvasContext(sampler, { willReadFrequently: true });

    // Downsample the source into a columns x rows buffer, cover-fitting it so it
    // matches CSS `background-size: cover` framing. `focalX` / `focalY` choose
    // which part of oversized media stays in frame; `panStuds` adds a small
    // horizontal manual nudge when needed.
    sampler.width = columns;
    sampler.height = rows;
    const scale = Math.max(columns / sourceSize.width, rows / sourceSize.height);
    const dw = sourceSize.width * scale;
    const dh = sourceSize.height * scale;
    const clampedFocalX = Math.max(0, Math.min(1, focalX));
    const clampedFocalY = Math.max(0, Math.min(1, focalY));

    // Rebuild the sprite cache only when the stud pixel size changes.
    const key = `${cell}`;
    if (key !== spriteRef.current.key) {
      spriteRef.current = { cache: new Map(), key };
    }

    const drawFrame = (source: CanvasImageSource) => {
      sctx.clearRect(0, 0, columns, rows);
      sctx.drawImage(
        source,
        (columns - dw) * clampedFocalX + panStuds,
        (rows - dh) * clampedFocalY,
        dw,
        dh
      );
      const pixels = sctx.getImageData(0, 0, columns, rows).data;
      const darken = Math.max(0, Math.min(0.9, mediaDarken));
      const darkenFactor = 1 - darken;

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const i = (y * columns + x) * 4;
          const hex = quantizeHex(
            pixels[i] * darkenFactor,
            pixels[i + 1] * darkenFactor,
            pixels[i + 2] * darkenFactor
          );
          const px = x * cell;
          const py = y * cell;
          ctx.drawImage(getSprite(hex), px, py, cell, cell);

          const j = surfaceJitter(x, y);
          ctx.globalAlpha = Math.abs(j) * 0.05;
          ctx.fillStyle = j > 0 ? "#fff" : "#000";
          ctx.fillRect(px, py, cell, cell);
          ctx.globalAlpha = 1;
        }
      }


    };

    const frameMs = 1000 / 24;
    let animationFrame = 0;
    let videoFrame = 0;
    let lastDraw = 0;
    let stopped = false;
    let cancelVideoFrame: ((handle: number) => void) | undefined;

    const tick = (time: number) => {
      if (stopped) return;
      if (time - lastDraw >= frameMs) {
        drawFrame(media as CanvasImageSource);
        lastDraw = time;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const videoMedia = media as VideoFrameElement;
    drawFrame(videoMedia);
    const scheduleVideoFrame = () => {
      if (stopped) return;
      if (typeof videoMedia.requestVideoFrameCallback === "function") {
        cancelVideoFrame = videoMedia.cancelVideoFrameCallback?.bind(videoMedia);
        videoFrame = videoMedia.requestVideoFrameCallback((time: number) => {
          if (stopped) return;
          if (time - lastDraw >= frameMs) {
            drawFrame(videoMedia);
            lastDraw = time;
          }
          scheduleVideoFrame();
        });
      } else {
        animationFrame = requestAnimationFrame(tick);
      }
    };
    scheduleVideoFrame();

    return () => {
      stopped = true;
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (videoFrame && cancelVideoFrame) {
        cancelVideoFrame(videoFrame);
      }
    };
  }, [grid, ready, src, panStuds, focalX, focalY, mediaDarken]);

  // Center the covering grid; the container clips the excess partial studs.
  const style = grid
    ? {
        left: `${grid.offsetX}px`,
        top: `${grid.offsetY}px`,
        width: `${grid.width}px`,
        height: `${grid.height}px`
      }
    : { display: "none" };

  return (
    <>
      <video
        key={src}
        ref={videoElementRef}
        className="brick-media-source"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onLoadedData={() => { setReady(true); setFailed(false); }}
        onError={() => setFailed(true)}
        aria-hidden="true"
      />
      {failed && <span className="hero-video-fallback">Video coming soon</span>}
      <canvas className="brick-canvas" ref={canvasRef} style={style} aria-hidden="true" />
    </>
  );
}
