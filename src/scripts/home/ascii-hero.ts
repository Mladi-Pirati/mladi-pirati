interface PaletteEntry {
  brightness: number;
  char: string;
  font: string;
  weight: number;
}

const FONT_SIZE = 14;
const CELL_WIDTH = FONT_SIZE * 0.6;
const CELL_HEIGHT = FONT_SIZE;
const CHARSET =
  " .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WEIGHTS = [300, 500, 800] as const;
const FONT_FAMILY = "'JetBrains Mono', monospace";

export function initAsciiHero(): void {
  const canvas = document.getElementById("hero-ascii");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const context = canvas.getContext("2d");

  if (!(context instanceof CanvasRenderingContext2D)) {
    return;
  }

  let cols = 0;
  let rows = 0;
  let time = 0;

  const brightnessCanvas = document.createElement("canvas");
  brightnessCanvas.width = 28;
  brightnessCanvas.height = 28;

  const brightnessContext = brightnessCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!(brightnessContext instanceof CanvasRenderingContext2D)) {
    return;
  }

  const palette = buildPalette(brightnessContext);

  const resize = (): void => {
    const parent = canvas.parentElement;

    if (!(parent instanceof HTMLElement)) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = parent.offsetWidth;
    const height = parent.offsetHeight;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    cols = Math.floor(width / CELL_WIDTH);
    rows = Math.floor(height / CELL_HEIGHT);
  };

  const draw = (): void => {
    time += 0.012;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.width / devicePixelRatio;
    const height = canvas.height / devicePixelRatio;

    context.clearRect(0, 0, width, height);
    context.textBaseline = "top";

    const centerX = cols / 2;
    const centerY = rows / 2;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const wave1 = Math.sin(x * 0.08 + y * 0.06 + time);
        const wave2 = Math.sin(x * 0.12 - y * 0.09 + time * 1.3);
        const wave3 = Math.cos((x + y) * 0.05 + time * 0.7);
        const value = (wave1 + wave2 + wave3) / 3;
        const intensity = (value + 1) / 2;

        const dx = (x - centerX) / centerX;
        const dy = (y - centerY) / centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const vignette = Math.min(distance * 0.9, 1);
        const brightness = intensity * vignette;

        if (brightness < 0.02) {
          continue;
        }

        const entry = findChar(palette, brightness);
        const alpha = brightness * 0.4;

        context.font = entry.font;
        context.fillStyle = `rgba(240, 160, 0, ${alpha.toFixed(3)})`;
        context.fillText(entry.char, x * CELL_WIDTH, y * CELL_HEIGHT);
      }
    }

    if (!reducedMotion) {
      window.requestAnimationFrame(draw);
    }
  };

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function buildPalette(
  brightnessContext: CanvasRenderingContext2D,
): PaletteEntry[] {
  const palette: PaletteEntry[] = [];

  for (const weight of WEIGHTS) {
    const font = `${weight} ${FONT_SIZE}px ${FONT_FAMILY}`;

    for (const char of CHARSET) {
      if (char === " ") {
        continue;
      }

      const brightness = estimateBrightness(brightnessContext, char, font);

      if (brightness <= 0) {
        continue;
      }

      palette.push({ char, weight, font, brightness });
    }
  }

  const maxBrightness = Math.max(...palette.map((entry) => entry.brightness));

  if (maxBrightness > 0) {
    palette.forEach((entry) => {
      entry.brightness /= maxBrightness;
    });
  }

  palette.sort((left, right) => left.brightness - right.brightness);

  return palette;
}

function estimateBrightness(
  brightnessContext: CanvasRenderingContext2D,
  char: string,
  font: string,
): number {
  brightnessContext.clearRect(0, 0, 28, 28);
  brightnessContext.font = font;
  brightnessContext.fillStyle = "#fff";
  brightnessContext.textBaseline = "middle";
  brightnessContext.fillText(char, 1, 14);

  const image = brightnessContext.getImageData(0, 0, 28, 28).data;
  let sum = 0;

  for (let index = 3; index < image.length; index += 4) {
    sum += image[index] ?? 0;
  }

  return sum / (255 * 28 * 28);
}

function findChar(palette: PaletteEntry[], targetBrightness: number): PaletteEntry {
  let low = 0;
  let high = palette.length - 1;

  while (low < high) {
    const middle = (low + high) >> 1;

    if ((palette[middle]?.brightness ?? 0) < targetBrightness) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  let bestEntry = palette[low] ?? palette[0];
  let bestScore = Number.POSITIVE_INFINITY;
  const start = Math.max(0, low - 10);
  const end = Math.min(palette.length, low + 10);

  for (let index = start; index < end; index += 1) {
    const entry = palette[index];

    if (!entry) {
      continue;
    }

    const score = Math.abs(entry.brightness - targetBrightness);

    if (score < bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry;
}
