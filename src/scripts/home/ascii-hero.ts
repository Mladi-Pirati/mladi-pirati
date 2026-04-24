import { WebGl2HeroRenderer } from "./hero/gpu";
import { buildBrightnessLut, buildMonospaceAtlas } from "./hero/measure";

const FONT_SIZE = 14;
const CHARSET =
  " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WEIGHTS = [400, 700] as const;
const FONT_FAMILY = "'JetBrains Mono', monospace";

export function initAsciiHero(): void {
  let canvasVisible = false;
  const iobs = new IntersectionObserver(([e]) => {
    canvasVisible = e.isIntersecting;
  });

  // mfs see me and get motion sickness *money spread*
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const canvas = document.getElementById(
    "hero-ascii",
  ) as HTMLCanvasElement | null;
  if (!(canvas instanceof HTMLCanvasElement)) return;

  // get a really minimal webgl2 context, we can (hopefully) survive with low perf GPU
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: false,
  });

  if (!gl) return; // unlucky :(

  const dpr = window.devicePixelRatio || 1;
  const atlas = buildMonospaceAtlas(
    CHARSET,
    FONT_FAMILY,
    WEIGHTS,
    FONT_SIZE,
    dpr,
  );
  const lut = buildBrightnessLut(atlas);
  const r = new WebGl2HeroRenderer(gl, atlas, lut);
  iobs.observe(canvas);

  r.init(canvas.width, canvas.height);

  function frame() {
    if (canvasVisible) {
      r.render(
        canvas.width,
        canvas.height,
        performance.now() / 2026,
      );
    }

    if (!reducedMotion) {
      requestAnimationFrame(frame);
    }
  }

  function resize() {
    const bb = canvas.getBoundingClientRect();
    canvas.width = bb.width * dpr;
    canvas.height = bb.height * dpr;

    if (reducedMotion) {
        // should prolly debounce
        r.render(canvas.width, canvas.height, 0);
    }
  }

  resize();
  frame();
  window.addEventListener("resize", resize);
}
