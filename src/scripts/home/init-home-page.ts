import { initAsciiHero } from "./ascii-hero";
import { initQuoteLoop } from "./quote-loop";
import { initSignupForm } from "./signup-form";
import { initSiteNav } from "./site-nav";

export function initHomePage(): void {
  initAsciiHero();
  initQuoteLoop();
  initSignupForm();
  initSiteNav();
}
