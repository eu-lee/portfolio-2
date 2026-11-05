import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="page">
        <Hero />
        <main id="content" tabIndex={-1}>
          <Projects />
          <section className="section" aria-labelledby="experience-heading">
            <h2 id="experience-heading">Work experience</h2>
            <p className="empty-state">Work experience coming soon.</p>
          </section>
        </main>
        <footer>Eugene</footer>
      </div>
    </>
  );
}
