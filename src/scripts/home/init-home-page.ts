import { initAsciiHero } from "./ascii-hero";
import { initQuoteLoop } from "./quote-loop";
import { initSiteNav } from "./site-nav";

export function initHomePage(): void {
  initAsciiHero();
  initQuoteLoop();
  initSiteNav();
}
