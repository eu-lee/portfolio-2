import { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import type { Project } from "../data/projects";
import { ProjectImage } from "./ProjectImage";

export function ProjectPage({ project }: { project: Project }) {
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${project.title} — Eugene Lee`;
    window.scrollTo({ top: 0, behavior: "instant" });
    title.current?.focus({ preventScroll: true });
    return () => { document.title = previousTitle; };
  }, [project]);

  return (
    <main id="content" className="project-page" tabIndex={-1}>
      <a className="project-back" href="#projects">← All projects</a>
      <article>
        <header className="project-page-header">
          <div className="project-page-hero">
            <ProjectImage className="project-page-image" src={project.thumbnail}
              alt={`${project.title} preview`} />
            <h1 ref={title} tabIndex={-1}>{project.title}</h1>
          </div>
          <div className="project-page-meta">
          <nav className="project-links" aria-label="Project links">
            {project.links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
          <p className="project-date">{new Intl.DateTimeFormat("en", {
            month: "long", year: "numeric", timeZone: "UTC",
          }).format(new Date(project.date))}</p>
          </div>
        </header>
        <div className="project-writeup"><Markdown>{project.description}</Markdown></div>
      </article>
    </main>
  );
}
