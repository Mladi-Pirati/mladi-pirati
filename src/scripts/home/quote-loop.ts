interface QuotePhrase {
  accent: string | null;
  text: string;
}

const SCRAMBLE_CHARS = ".:=-~+*/%#@|\\<>[]{}";
const PHRASES: QuotePhrase[] = [
  { text: "nimate svojega stanovanja.", accent: null },
  { text: "ste naveličani korupcije.", accent: null },
  { text: "hočete, da se to spremeni", accent: "spremeni" },
];

export function initQuoteLoop(): void {
  const element = document.getElementById("hero-quote-loop");

  if (!(element instanceof HTMLElement)) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const framesPerSecond = 24;
  const frameInterval = 1000 / framesPerSecond;
  const holdTime = 1200;

  if (reducedMotion) {
    const last = PHRASES[PHRASES.length - 1];

    if (!last) {
      return;
    }

    element.innerHTML =
      accentify(last.text, last.accent) + '<span class="blink-cursor">&gt;</span>';
    return;
  }

  const run = async (): Promise<void> => {
    for (let index = 0; index < PHRASES.length; index += 1) {
      const phrase = PHRASES[index];

      if (!phrase) {
        continue;
      }

      await decodeIn(element, phrase.text, phrase.accent, frameInterval);

      if (index < PHRASES.length - 1) {
        await sleep(holdTime);
        await scrambleOut(element, phrase.text, frameInterval);
        await sleep(200);
      }
    }

    element.innerHTML = element.innerHTML + '<span class="blink-cursor">&gt;</span>';
  };

  sleep(600).then(run);
}

function randomChar(): string {
  const index = Math.floor(Math.random() * SCRAMBLE_CHARS.length);
  return SCRAMBLE_CHARS[index] ?? ".";
}

function accentify(text: string, accentWord: string | null): string {
  if (!accentWord) {
    return text;
  }

  const index = text.indexOf(accentWord);

  if (index === -1) {
    return text;
  }

  return (
    text.slice(0, index) +
    '<span class="accent">' +
    accentWord +
    "</span>" +
    text.slice(index + accentWord.length)
  );
}

function decodeIn(
  element: HTMLElement,
  text: string,
  accentWord: string | null,
  frameInterval: number,
): Promise<void> {
  return new Promise((resolve) => {
    const letters = text.split("");
    const charIndices: number[] = [];

    letters.forEach((char, index) => {
      if (char !== " ") {
        charIndices.push(index);
      }
    });

    const total = charIndices.length;
    const settleAt = charIndices.map((_, index) => {
      const turnStart = (index / total) * 30;
      return Math.floor(turnStart + 6 + Math.random() * 10);
    });
    const activateAt = settleAt.map((value) => Math.max(0, value - 12));
    const totalFrames = Math.max(...settleAt) + 4;
    const current = letters.map((char) => (char === " " ? " " : " "));

    let frame = 0;

    const interval = window.setInterval(() => {
      frame += 1;

      for (let index = 0; index < charIndices.length; index += 1) {
        const charIndex = charIndices[index];

        if (charIndex === undefined) {
          continue;
        }

        if (frame < (activateAt[index] ?? 0)) {
          current[charIndex] = " ";
        } else if (frame >= (settleAt[index] ?? 0)) {
          current[charIndex] = letters[charIndex] ?? " ";
        } else {
          current[charIndex] = randomChar();
        }
      }

      element.textContent = current.join("");

      if (frame >= totalFrames) {
        window.clearInterval(interval);
        element.innerHTML = accentify(text, accentWord);
        resolve();
      }
    }, frameInterval);
  });
}

function scrambleOut(
  element: HTMLElement,
  text: string,
  frameInterval: number,
): Promise<void> {
  return new Promise((resolve) => {
    const letters = text.split("");
    const charIndices: number[] = [];

    letters.forEach((char, index) => {
      if (char !== " ") {
        charIndices.push(index);
      }
    });

    const total = charIndices.length;
    const dissolveAt = charIndices.map((_, index) =>
      Math.floor((index / total) * 20 + Math.random() * 8),
    );
    const totalFrames = Math.max(...dissolveAt) + 6;
    const current = letters.slice();

    let frame = 0;

    const interval = window.setInterval(() => {
      frame += 1;

      for (let index = 0; index < charIndices.length; index += 1) {
        const charIndex = charIndices[index];

        if (charIndex === undefined) {
          continue;
        }

        if (frame >= (dissolveAt[index] ?? 0) + 5) {
          current[charIndex] = " ";
        } else if (frame >= (dissolveAt[index] ?? 0)) {
          current[charIndex] = randomChar();
        }
      }

      element.textContent = current.join("");

      if (frame >= totalFrames) {
        window.clearInterval(interval);
        element.textContent = "";
        resolve();
      }
    }, frameInterval);
  });
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
