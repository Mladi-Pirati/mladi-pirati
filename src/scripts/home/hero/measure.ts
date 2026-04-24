function charSize(charset: string[], font: string) {
  const tmpCanvas = new OffscreenCanvas(1, 1);
  const tmp2dContext = tmpCanvas.getContext("2d");
  if (!tmp2dContext) throw new Error("no 2d context");

  let w = 0;
  let h = 0;

  tmp2dContext.font = font;

  for (const char of charset) {
    const m = tmp2dContext.measureText(char);
    // holy yap properties
    const cw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const ch = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

    w = Math.max(w, cw);
    h = Math.max(h, ch);
  }

  return { w, h };
}

export type TAtlas = {
  data: ImageData;
  cellW: number;
  cellH: number;
  cellsPerDim: number;
  used: number;
};

export function buildMonospaceAtlas(
  chars: string,
  fontFamily: string,
  weights: readonly number[],
  fontSize: number,
  dpr = 1,
): TAtlas {
  const charset = chars.split("");
  const n = charset.length * weights.length;
  const cellsPerDim = Math.ceil(Math.sqrt(n));

  // mesaure charset in CSS pixels (at max weight)
  const maxLogicalSize = charSize(
    charset,
    `${Math.max(...weights)} ${fontSize}px ${fontFamily}`,
  );

  // determine the size of each cell in the atlas (in device pixels)
  const cellW = Math.ceil(maxLogicalSize.w * dpr);
  const cellH = Math.ceil(maxLogicalSize.h * dpr);

  // now we know the size of the atlas and the size of each cell, we can create the atlas canvas
  const canvas = new OffscreenCanvas(cellsPerDim * cellW, cellsPerDim * cellH);

  const g = canvas.getContext("2d");
  if (!g) throw new Error("no 2d context");

  g.textBaseline = "top";
  g.fillStyle = "black";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = "white";

  let i = 0;
  for (const weight of weights) {
    g.font = `${weight} ${fontSize}px ${fontFamily}`;

    for (const char of charset) {
      const x = (i % cellsPerDim) * cellW;
      const y = ~~(i / cellsPerDim) * cellH;

      g.fillText(char, x, y);
      i++;
    }
  }

  const data = g.getImageData(0, 0, canvas.width, canvas.height);

  return {
    data,
    cellW,
    cellH,
    cellsPerDim,
    used: n,
  };
}

/**
 * Builds a lookup table that maps brightness values (0-255) to the index of the
 * character in the atlas that best matches that brightness.
 */
export function buildBrightnessLut(atlas: TAtlas, stops = 256): Uint16Array {
  const brightnesses = [] as { idx: number; brightness: number }[];
  const lut = new Uint16Array(stops);

  const {
    data: { data, width },
    cellW,
    cellH,
    cellsPerDim,
    used,
  } = atlas;

  for (let i = 0; i < used; i++) {
    const x = (i % cellsPerDim) * cellW;
    const y = ~~(i / cellsPerDim) * cellH;

    let sum = 0;

    for (let j = 0; j < cellH; j++) {
      for (let k = 0; k < cellW; k++) {
        const index = ((y + j) * width + (x + k)) * 4;
        sum += data[index];
      }
    }

    brightnesses.push({ idx: i, brightness: sum });
  }

  brightnesses.sort((a, b) => a.brightness - b.brightness);
  const maxBrightness = brightnesses[brightnesses.length - 1].brightness;
  brightnesses.forEach((b) => (b.brightness /= maxBrightness));

  // klavdij napisu :upside_down_face:
  for (let i = 0; i < stops; i++) {
    const targetBrightness = i / (stops - 1);
    let left = 0;
    let right = brightnesses.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (brightnesses[mid].brightness < targetBrightness) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    const closest =
      left === 0 ||
      Math.abs(brightnesses[left].brightness - targetBrightness) <
        Math.abs(brightnesses[left - 1].brightness - targetBrightness)
        ? left
        : left - 1;

    lut[i] = brightnesses[closest].idx;
  }

  return lut;
}
