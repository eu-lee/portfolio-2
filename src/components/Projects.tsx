import { projects } from "../data/projects";
import { ProjectImage } from "./ProjectImage";

export function Projects() {
  return (
      <div className="project-grid">
        {projects.map((project) => (
          <a className="project-card" key={project.id} href={`#projects/${project.id}`}>
            <div className="project-thumbnail">
              <ProjectImage src={project.thumbnail} alt="" loading="lazy" />
            </div>
            <div className="project-caption">
              <h3 className="project-title">{project.title}</h3>
              {project.summary && <p>{project.summary}</p>}
            </div>
          </a>
        ))}
      </div>
  );
}
