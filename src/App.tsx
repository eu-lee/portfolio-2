import { Hero } from "./components/Hero";
import { PortfolioTabs } from "./components/PortfolioTabs";
import { useEffect, useState } from "react";
import { projects } from "./data/projects";
import { ProjectPage } from "./components/ProjectPage";

export default function App() {
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
      <div className="page">
        {project ? <ProjectPage key={project.id} project={project} /> : <>
        <Hero />
        <main id="content" tabIndex={-1}>
          <PortfolioTabs />
        </main>
        </>}
        <footer>Eugene</footer>
      </div>
    </>
  );
}
