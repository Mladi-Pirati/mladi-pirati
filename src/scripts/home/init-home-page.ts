import { initAsciiHero } from "./ascii-hero";
import { initQuoteLoop } from "./quote-loop";
import { initSiteNav } from "./site-nav";

export function initHomePage(): void {
  try {
    initAsciiHero();
  } catch (e) {
    console.error("hero error", e);
  }
  initQuoteLoop();
  initSiteNav();
}
