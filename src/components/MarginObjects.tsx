import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import walnuts from "../../walnuts.png";

type Point = { x: number; y: number };
const objects = [
  { id: "tile", label: "Object 01", side: "left", height: 0.3 },
  { id: "walnuts", label: "Walnuts", side: "right", height: 0.52 },
  { id: "stone", label: "Object 03", side: "left", height: 0.76 },
] as const;
type ObjectItem = (typeof objects)[number];
function objectSize(item: ObjectItem): number {
  if (item.id !== "walnuts") return 48;
  const gutter = document.querySelector(".page")?.getBoundingClientRect().left ?? 56;
  return Math.max(48, Math.min(120, gutter - 8));
}
const returnDelay = 3000;

function inMargin(point: Point, size: number): boolean {
  const page = document.querySelector(".page")?.getBoundingClientRect();
  return !!page && (point.x + size <= page.left || point.x >= page.right);
}

function clampToViewport(point: Point, size: number): Point {
  return {
    x: Math.max(0, Math.min(window.innerWidth - size, point.x)),
    y: Math.max(0, Math.min(window.innerHeight - size, point.y)),
  };
}

function home(item: ObjectItem): Point {
  const size = objectSize(item);
  const page = document.querySelector(".page")?.getBoundingClientRect();
  const gutter = page?.left ?? 56;
  return {
    x: item.side === "left" ? Math.max(4, (gutter - size) / 2) : window.innerWidth - Math.max(4, (gutter - size) / 2) - size,
    y: Math.max(8, Math.min(window.innerHeight - size - 8, window.innerHeight * item.height)),
  };
}

function MarginObject({ item, onOpen }: { item: ObjectItem; onOpen: () => void }) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState(48);
  const initialPosition = useRef<Point | null>(null);
  const lastMarginPosition = useRef<Point | null>(null);
  const currentPosition = useRef<Point | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ pointer: number; start: Point; origin: Point; moved: boolean } | null>(null);
  const suppressDoubleClick = useRef(false);

  const clearReturn = () => clearTimeout(timer.current);
  const move = (point: Point) => {
    const next = clampToViewport(point, objectSize(item));
    currentPosition.current = next;
    setPosition(next);
  };
  const returnHome = () => {
    clearReturn();
    move(lastMarginPosition.current ?? initialPosition.current ?? home(item));
  };
  const scheduleReturn = () => {
    clearReturn();
    timer.current = setTimeout(returnHome, returnDelay);
  };
  const settle = () => {
    clearReturn();
    const point = currentPosition.current;
    if (point && inMargin(point, objectSize(item))) lastMarginPosition.current = { ...point };
    else scheduleReturn();
  };

  useLayoutEffect(() => {
    initialPosition.current = home(item);
    lastMarginPosition.current = { ...initialPosition.current };
    const reset = () => {
      const size = objectSize(item);
      setSize(size);
      clearTimeout(timer.current);
      drag.current = null;
      setDragging(false);
      // Preserve the last margin drop across resizes, keeping it outside the page.
      const saved = clampToViewport(lastMarginPosition.current ?? home(item), size);
      const page = document.querySelector(".page")?.getBoundingClientRect();
      if (page && !inMargin(saved, size)) {
        saved.x = saved.x + size / 2 < window.innerWidth / 2
          ? Math.max(0, page.left - size)
          : Math.min(window.innerWidth - size, page.right);
      }
      lastMarginPosition.current = saved;
      currentPosition.current = saved;
      setPosition(saved);
    };
    reset();
    window.addEventListener("resize", reset);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("resize", reset);
    };
  }, [item]);

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    suppressDoubleClick.current = active.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) returnHome();
    else settle();
  };

  // Mount at the calculated position so CSS never transitions from the origin.
  if (!position) return null;

  return (
    <button
      type="button"
      className={`margin-object margin-object--${item.id}${dragging ? " is-dragging" : ""}`}
      style={{ "--object-size": `${size}px`, "--object-x": `${position.x}px`, "--object-y": `${position.y}px` } as CSSProperties}
      aria-label={`${item.label}: double-click or press Enter for details. Drag or use arrow keys to move.`}
      aria-haspopup="dialog"
      onPointerDown={(event) => {
        if (event.button !== 0 || !position || drag.current) return;
        clearReturn();
        drag.current = { pointer: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: position, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const active = drag.current;
        if (!active || active.pointer !== event.pointerId) return;
        const dx = event.clientX - active.start.x;
        const dy = event.clientY - active.start.y;
        if (Math.hypot(dx, dy) > 5) active.moved = true;
        if (!active.moved) return;
        setDragging(true);
        move({ x: active.origin.x + dx, y: active.origin.y + dy });
      }}
      onPointerUp={(event) => finishDrag(event)}
      onPointerCancel={(event) => finishDrag(event, true)}
      onLostPointerCapture={(event) => finishDrag(event, true)}
      onDoubleClick={() => { if (!suppressDoubleClick.current) onOpen(); }}
      onClick={(event) => { if (event.detail === 0) onOpen(); }}
      onKeyDown={(event) => {
        const directions: Record<string, Point> = { ArrowLeft: { x: -16, y: 0 }, ArrowRight: { x: 16, y: 0 }, ArrowUp: { x: 0, y: -16 }, ArrowDown: { x: 0, y: 16 } };
        const direction = directions[event.key];
        if (direction && position) {
          event.preventDefault();
          move({ x: position.x + direction.x, y: position.y + direction.y });
          settle();
        } else if (event.key === "Escape") returnHome();
      }}
    >
      <span className="object-visual">
      {item.id === "walnuts" ? (
        <img className="object-shape" src={walnuts} alt="" draggable={false} />
      ) : (
        <span className="object-shape" aria-hidden="true" />
      )}
      <span
        className="object-label"
        aria-hidden="true"
        style={{
          left: Math.max(52 - position.x, Math.min(size / 2, window.innerWidth - position.x - 52)) - 4,
          ...(position.y + size + 44 > window.innerHeight ? { top: "auto", bottom: "calc(100% + 6px)" } : {}),
        }}
      >
        {item.label}
      </span>
      </span>
    </button>
  );
}

export function MarginObjects() {
  const [selected, setSelected] = useState<ObjectItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <aside className="margin-objects" aria-label="Personal objects">
        {objects.map((item) => <MarginObject key={item.id} item={item} onOpen={() => {
          setSelected(item);
          dialog.current?.showModal();
        }} />)}
      </aside>
      <dialog ref={dialog} className="object-dialog" aria-labelledby="object-title" aria-describedby="object-description" onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
        <div className="object-dialog-content">
          <form method="dialog"><button className="object-close" aria-label="Close details">×</button></form>
          <p className="object-eyebrow">A personal object</p>
          <h2 id="object-title">{selected?.label}</h2>
          <p id="object-description">A placeholder for a personal object. Its story and significance will go here.</p>
        </div>
      </dialog>
    </>
  );
}
