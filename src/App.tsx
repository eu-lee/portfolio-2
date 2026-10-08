import { Hero } from "./components/Hero";
import { PersonalTable } from "./components/PersonalTable";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="page">
        <Hero />
        <main id="content" tabIndex={-1}>
          <section className="section" aria-labelledby="projects-heading">
            <h2 id="projects-heading">Projects</h2>
            <p className="empty-state">Selected projects coming soon.</p>
          </section>
          <section className="section" aria-labelledby="experience-heading">
            <h2 id="experience-heading">Work experience</h2>
            <p className="empty-state">Work experience coming soon.</p>
          </section>
          <PersonalTable />
        </main>
        <footer>Eugene</footer>
      </div>
    </>
  );
}
