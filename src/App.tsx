import { Hero } from "./components/Hero";
import { PortfolioTabs } from "./components/PortfolioTabs";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <div className="page">
        <Hero />
        <main id="content" tabIndex={-1}>
          <PortfolioTabs />
        </main>
        <footer>Eugene</footer>
      </div>
    </>
  );
}
