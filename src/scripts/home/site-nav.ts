const MOBILE_BREAKPOINT = 640;
const NAV_HEIGHT = 70;

export function initSiteNav(): void {
  const hero = document.getElementById("hero");
  const nav = document.getElementById("site-nav");
  const menu = document.getElementById("nav-menu");
  const toggle = document.getElementById("nav-toggle");
  const scrollArrow = document.getElementById("scroll-arrow");

  if (
    !(hero instanceof HTMLElement) ||
    !(nav instanceof HTMLElement) ||
    !(menu instanceof HTMLUListElement)
  ) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      nav.dataset.fixed = !(entry?.isIntersecting ?? true) ? "true" : "false";
    },
    { threshold: 0, rootMargin: `-${NAV_HEIGHT}px 0px 0px 0px` },
  );

  observer.observe(hero);

  if (scrollArrow instanceof HTMLButtonElement) {
    scrollArrow.addEventListener("click", () => {
      document.getElementById("o-nas")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (toggle instanceof HTMLButtonElement) {
    const setExpanded = (expanded: boolean): void => {
      menu.dataset.open = expanded ? "true" : "false";
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setExpanded(!expanded);
    });

    menu.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
      link.addEventListener("click", () => {
        setExpanded(false);
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        setExpanded(false);
      }
    });
  }
}
