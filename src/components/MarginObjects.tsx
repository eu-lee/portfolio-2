import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import type { CSSProperties, PointerEvent } from "react";
import { objects } from "../data/items";
import type { ObjectItem } from "../data/items";

import { clampPosition, isMargin } from "../lib/itemLayout";
import type { Point, ItemLayout } from "../lib/itemLayout";

const returnDelay = 5000;

function readLayout(): ItemLayout {
  return { width: document.body.clientWidth, height: Math.max(200, window.innerHeight) };
}

function MarginObject({ item, onOpen, onRaise, zIndex }: { item: ObjectItem; onOpen: () => void; onRaise: () => void; zIndex: number }) {
  const [position, setPosition] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const size = item.size;
  const layout = useRef<ItemLayout>({ width: 680, height: 856 });
  const [viewport, setViewport] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const initialPosition = useRef<Point | null>(null);
  const lastMarginPosition = useRef<Point | null>(null);
  const currentPosition = useRef<Point | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ pointer: number; start: Point; latest: Point; origin: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const clearReturn = () => clearTimeout(timer.current);
  const move = (point: Point) => {
    const next = clampPosition(point, size, layout.current);
    currentPosition.current = next;
    setPosition(next);
  };
  const returnHome = () => {
    clearReturn();
    const home = lastMarginPosition.current ?? initialPosition.current ?? { ...item.initial };
    currentPosition.current = home;
    setPosition(home);
  };
  const scheduleReturn = () => {
    clearReturn();
    timer.current = setTimeout(returnHome, returnDelay);
  };
  const settle = () => {
    clearReturn();
    const point = currentPosition.current;
    if (point && isMargin(point, size, layout.current)) lastMarginPosition.current = { ...point };
    else scheduleReturn();
  };

  useLayoutEffect(() => {
    initialPosition.current = { ...item.initial };
    lastMarginPosition.current = { ...item.initial };
    currentPosition.current = { ...item.initial };
    setPosition({ ...item.initial });
    const updateLayout = () => {
      layout.current = readLayout();
      setViewport({ left: window.scrollX, top: window.scrollY,
        width: document.documentElement.clientWidth, height: window.innerHeight });
    };
    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, { passive: true });
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout);
    };
  }, [item]);

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    suppressClick.current = cancelled || active.moved;
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
  const screenX = layout.current.width / 2 + position.x - viewport.left;
  const screenY = position.y - viewport.top;
  if (screenX < 0 || screenY < 0 || screenX + size > viewport.width || screenY + size > viewport.height) return null;

  return (
    <button
      type="button"
      className={`margin-object margin-object--${item.id}${dragging ? " is-dragging" : ""}`}
      style={{ zIndex, "--object-label-gap": `${item.labelGap}px`, "--object-size": `${size}px`, "--object-x": `${position.x}px`, "--object-y": `${position.y}px` } as CSSProperties}
      aria-label={`${item.hoverLabel}: Click or press Enter for details. Drag or use arrow keys to move.`}
      aria-haspopup="dialog"
      onPointerDown={(event) => {
        if (event.button !== 0 || !position || drag.current) return;
        suppressClick.current = false;
        onRaise();
        clearReturn();
        drag.current = { pointer: event.pointerId, start: { x: event.pageX, y: event.pageY }, latest: { x: event.pageX, y: event.pageY }, origin: position, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const active = drag.current;
        if (!active || active.pointer !== event.pointerId) return;
        active.latest = { x: event.pageX, y: event.pageY };
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
      onClick={(event) => {
        // Keyboard activation still works after a drag; pointer clicks only open
        // when the gesture stayed within the 5px movement threshold.
        if (event.detail === 0 || !suppressClick.current) onOpen();
      }}
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
          left: Math.max(52 - layout.current.width / 2 - position.x, Math.min(size / 2, layout.current.width / 2 - position.x - 52)) - 4,
          ...(position.y + size + 44 > layout.current.height ? { top: "auto", bottom: "calc(100% + var(--object-label-gap, 10px))" } : {}),
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
  const [closing, setClosing] = useState(false);
  const [stackOrder, setStackOrder] = useState(() => objects.map((item) => item.id));
  const raise = (id: ObjectItem["id"]) => {
    setStackOrder((order) => order[order.length - 1] === id ? order : [...order.filter((entry) => entry !== id), id]);
  };
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTitle = useRef<HTMLHeadingElement>(null);
  const closeDialog = () => {
    if (!dialog.current?.open || closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) dialog.current.close();
    else setClosing(true);
  };

  return (
    <>
      <aside className="margin-objects" aria-label="Personal objects">
        {objects.map((item) => <MarginObject key={item.id} item={item} zIndex={5 + stackOrder.indexOf(item.id)} onRaise={() => raise(item.id)} onOpen={() => {
          setSelected(item);
          setClosing(false);
          dialog.current?.showModal();
          dialogTitle.current?.focus();
        }} />)}
      </aside>
      <dialog ref={dialog} className={`object-dialog${closing ? " is-closing" : ""}`} aria-labelledby="object-title" aria-describedby="object-description"
        onCancel={(event) => { event.preventDefault(); closeDialog(); }}
        onClose={() => setClosing(false)}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === "object-dialog-out") dialog.current?.close();
        }}
        onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <div className="object-dialog-content">
          <div className="object-dialog-header">
            <h2 ref={dialogTitle} id="object-title" tabIndex={-1}>{selected?.title}</h2>
            <form method="dialog" onSubmit={(event) => { event.preventDefault(); closeDialog(); }}>
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
