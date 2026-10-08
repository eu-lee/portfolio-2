import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import type { CSSProperties, PointerEvent } from "react";
import { objects } from "../data/items";
import type { ObjectItem } from "../data/items";

type Point = { x: number; y: number };
// Coordinates are fixed CSS pixels relative to the page's horizontal center.
const layoutWidth = 1512;
const layoutHeight = 856;
const returnDelay = 1500;

function inMargin(point: Point, size: number): boolean {
  const page = document.querySelector(".page")?.getBoundingClientRect();
  const x = document.documentElement.clientWidth / 2 + point.x - window.scrollX;
  return !!page && (x + size <= page.left || x >= page.right);
}

function clampToLayout(point: Point, size: number): Point {
  return {
    x: Math.max(-layoutWidth / 2, Math.min(layoutWidth / 2 - size, point.x)),
    y: Math.max(0, Math.min(layoutHeight - size, point.y)),
  };
}

function MarginObject({ item, onOpen, onRaise, zIndex }: { item: ObjectItem; onOpen: () => void; onRaise: () => void; zIndex: number }) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const size = item.size;
  const initialPosition = useRef<Point | null>(null);
  const lastMarginPosition = useRef<Point | null>(null);
  const currentPosition = useRef<Point | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ pointer: number; start: Point; origin: Point; moved: boolean } | null>(null);
  const suppressDoubleClick = useRef(false);

  const clearReturn = () => clearTimeout(timer.current);
  const move = (point: Point) => {
    const next = clampToLayout(point, size);
    currentPosition.current = next;
    setPosition(next);
  };
  const returnHome = () => {
    clearReturn();
    move(lastMarginPosition.current ?? initialPosition.current ?? { ...item.initial });
  };
  const scheduleReturn = () => {
    clearReturn();
    timer.current = setTimeout(returnHome, returnDelay);
  };
  const settle = () => {
    clearReturn();
    const point = currentPosition.current;
    if (point && inMargin(point, size)) lastMarginPosition.current = { ...point };
    else scheduleReturn();
  };

  useLayoutEffect(() => {
    initialPosition.current = { ...item.initial };
    lastMarginPosition.current = { ...initialPosition.current };
    currentPosition.current = { ...item.initial };
    setPosition({ ...item.initial });
    return () => clearTimeout(timer.current);
  }, [item]);

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    suppressDoubleClick.current = active.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) returnHome();
    else {
      if (active.moved) onRaise();
      settle();
    }
  };

  // Mount at the calculated position so CSS never transitions from the origin.
  if (!position) return null;

  return (
    <button
      type="button"
      className={`margin-object margin-object--${item.id}${dragging ? " is-dragging" : ""}`}
      style={{ zIndex, "--object-label-gap": `${item.labelGap}px`, "--object-size": `${size}px`, "--object-x": `${position.x}px`, "--object-y": `${position.y}px` } as CSSProperties}
      aria-label={`${item.hoverLabel}: double-click or press Enter for details. Drag or use arrow keys to move.`}
      aria-haspopup="dialog"
      onPointerDown={(event) => {
        if (event.button !== 0 || !position || drag.current) return;
        onRaise();
        clearReturn();
        drag.current = { pointer: event.pointerId, start: { x: event.pageX, y: event.pageY }, origin: position, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const active = drag.current;
        if (!active || active.pointer !== event.pointerId) return;
        const dx = event.pageX - active.start.x;
        const dy = event.pageY - active.start.y;
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
          onRaise();
          move({ x: position.x + direction.x, y: position.y + direction.y });
          settle();
        } else if (event.key === "Escape") returnHome();
      }}
    >
      <span className="object-visual">
      <img className="object-shape object-image" src={item.image} alt="" draggable={false} />
      <span
        className="object-label"
        aria-hidden="true"
        style={{
          left: Math.max(52 - layoutWidth / 2 - position.x, Math.min(size / 2, layoutWidth / 2 - position.x - 52)) - 4,
          ...(position.y + size + 44 > layoutHeight ? { top: "auto", bottom: "calc(100% + var(--object-label-gap, 10px))" } : {}),
        }}
      >
        {item.hoverLabel}
      </span>
      </span>
    </button>
  );
}

export function MarginObjects() {
  const [selected, setSelected] = useState<ObjectItem | null>(null);
  const [stackOrder, setStackOrder] = useState(() => objects.map((item) => item.id));
  const raise = (id: ObjectItem["id"]) => {
    setStackOrder((order) => order[order.length - 1] === id ? order : [...order.filter((entry) => entry !== id), id]);
  };
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useRef<HTMLHeadingElement>(null);

  return (
    <>
      <aside className="margin-objects" aria-label="Personal objects">
        {objects.map((item) => <MarginObject key={item.id} item={item} zIndex={5 + stackOrder.indexOf(item.id)} onRaise={() => raise(item.id)} onOpen={() => {
          setSelected(item);
          dialog.current?.showModal();
          dialogTitle.current?.focus();
        }} />)}
      </aside>
      <dialog ref={dialog} className="object-dialog" aria-labelledby="object-title" aria-describedby="object-description" onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
        <div className="object-dialog-content">
          <div className="object-dialog-header">
            <h2 ref={dialogTitle} id="object-title" tabIndex={-1}>{selected?.title}</h2>
            <form method="dialog">
              <button className="object-close" aria-label="Close details">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </form>
          </div>
          {selected && <img className="object-dialog-image" src={selected.image} alt={selected.imageAlt} />}
          <hr className="object-dialog-divider" />
          <div id="object-description"><Markdown>{selected?.description ?? ""}</Markdown></div>
        </div>
      </dialog>
    </>
  );
}
