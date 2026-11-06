import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Projects } from "./Projects";

const tabs = [
  { id: "projects", label: "Projects" },
  { id: "work", label: "Work" },
  { id: "writing", label: "Writing" },
] as const;
type TabId = typeof tabs[number]["id"];

function tabFromHash(): TabId {
  return tabs.find((tab) => `#${tab.id}` === window.location.hash)?.id ?? "projects";
}

export function PortfolioTabs() {
  const [active, setActive] = useState<TabId>(tabFromHash);
  const list = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const sync = () => setActive(tabFromHash());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useLayoutEffect(() => {
    const button = buttons.current[tabs.findIndex((tab) => tab.id === active)];
    if (!button) return;
    const measure = () => setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    measure();
    const observer = new ResizeObserver(measure);
    buttons.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [active]);

  function select(id: TabId) {
    setActive(id);
    // Update the URL without fragment navigation or page scrolling.
    window.history.replaceState(window.history.state, "", `#${id}`);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % tabs.length; break;
      case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
      case "Home": next = 0; break;
      case "End": next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    select(tabs[next].id);
    const button = buttons.current[next];
    button?.focus({ preventScroll: true });
    // Only move the tab strip horizontally if the focused tab is clipped.
    const strip = list.current;
    if (strip && button) {
      if (button.offsetLeft < strip.scrollLeft) strip.scrollLeft = button.offsetLeft;
      else if (button.offsetLeft + button.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = button.offsetLeft + button.offsetWidth - strip.clientWidth;
      }
    }
  }

  return (
    <section className="section portfolio-tabs" aria-label="Portfolio">
      <div className="portfolio-tablist" role="tablist" aria-label="Portfolio sections" ref={list}>
        {tabs.map((tab, index) => (
          <button key={tab.id} ref={(element) => { buttons.current[index] = element; }}
            className="portfolio-tab" type="button" role="tab" id={`tab-${tab.id}`}
            aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => select(tab.id)} onKeyDown={(event) => handleKey(event, index)}>
            {tab.label}
          </button>
        ))}
        <span className="portfolio-tab-indicator" aria-hidden="true"
          style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }} />
      </div>
      <div className="portfolio-panels">
        {tabs.map((tab) => (
          <div key={tab.id} id={`panel-${tab.id}`} role="tabpanel"
            aria-labelledby={`tab-${tab.id}`} tabIndex={active === tab.id ? 0 : -1}
            aria-hidden={active !== tab.id} inert={active !== tab.id}
            className={`portfolio-panel${active === tab.id ? " is-active" : ""}`}>
            {tab.id === "projects" ? <Projects /> : <p className="tab-placeholder">Coming soon</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
