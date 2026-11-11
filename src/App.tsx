import { Hero } from "./components/Hero";
import { PortfolioTabs } from "./components/PortfolioTabs";
import { useEffect, useState } from "react";
import { projects } from "./data/projects";
import { ProjectPage } from "./components/ProjectPage";
import { usePageScaleController } from "./lib/pageScale";

export default function App() {
  usePageScaleController();
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const project = projects.find((item) => hash === `#projects/${item.id}`);

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className={`page${project ? " page--project" : ""}`}>
        <div className="page-content">
        <div className="homepage-content" aria-hidden={project ? true : undefined} inert={!!project}>
        <Hero showMedia={!project} />
        <main id={project ? undefined : "content"} tabIndex={-1}>
          <PortfolioTabs />
        </main>
        </div>
        {project && <ProjectPage key={project.id} project={project} />}
        </div>
        <footer className="site-footer">
          <a href="https://www.linkedin.com/in/eu-lee/" target="_blank" rel="noreferrer">linkedin</a>
          <a href="mailto:eugene.lee@uwaterloo.ca">email</a>
          <a href="https://github.com/eu-lee" target="_blank" rel="noreferrer">github</a>
        </footer>
      </div>
    </>
  );
}
