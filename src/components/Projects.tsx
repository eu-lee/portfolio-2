import { projects } from "../data/projects";

export function Projects({ preview = false }: { preview?: boolean }) {
  const visibleProjects = preview ? projects.slice(0, 3) : projects;

  return (
    <div className="project-grid">
      {visibleProjects.map((project) => (
        <article className="project-card" key={project.id}>
          {project.image ? (
            <img className="project-image" src={project.image} alt={project.imageAlt ?? ""} loading="lazy" />
          ) : (
            <div className="project-image project-image-placeholder">
              <span>Image coming soon</span>
            </div>
          )}
          <h3>
            {project.href ? <a href={project.href}>{project.title}</a> : project.title}
          </h3>
          <p>{project.description}</p>
          {project.tags.length > 0 && (
            <ul className="project-tags" aria-label="Technologies">
              {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
          {project.href && <span className="project-arrow" aria-hidden="true">↗</span>}
        </article>
      ))}
    </div>
  );
}

export function ProjectsPage() {
  return (
    <div className="page projects-page">
      <a className="projects-back" href="/#projects-heading"><span aria-hidden="true">←</span> Go back</a>
      <main id="content" tabIndex={-1}>
        <h1>Projects</h1>
        <Projects />
      </main>
    </div>
  );
}
