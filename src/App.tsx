import { Hero } from "./components/Hero";
import { MarginObjects } from "./components/MarginObjects";
import { Projects, ProjectsPage } from "./components/Projects";

export default function App() {
  if (window.location.pathname.replace(/\/$/, "") === "/projects") {
    return <ProjectsPage />;
  }

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="page">
        <Hero />
        <main id="content" className="home-content" tabIndex={-1}>
          <section className="section" aria-labelledby="projects-heading">
            <div className="projects-heading">
              <h2 id="projects-heading">Projects</h2>
              <a href="/projects">View all <span aria-hidden="true">→</span></a>
            </div>
            <Projects preview />
          </section>
          <section className="section" aria-labelledby="experience-heading">
            <h2 id="experience-heading">Work experience</h2>
            <p className="empty-state">Work experience coming soon.</p>
          </section>
        </main>
      </div>
      <MarginObjects />
    </>
  );
}
