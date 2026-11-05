import { projects } from "../data/projects";

export function Projects() {
  return (
    <section className="section" aria-labelledby="projects-heading">
      <h2 id="projects-heading">Projects</h2>
      <div className="project-grid">
        {projects.map((project) => (
          <a className="project-card" key={project.id} href={project.links[0].href}
            target="_blank" rel="noreferrer">
            <div className="project-thumbnail">
              <img src={project.thumbnail} alt="" loading="lazy" />
            </div>
            <div className="project-caption">
              <h3 className="project-title">{project.title}<span className="project-arrow" aria-hidden="true">↗</span></h3>
              <p>{project.summary}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
