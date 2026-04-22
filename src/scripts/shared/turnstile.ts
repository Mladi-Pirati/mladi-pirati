const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileWidgetId = string | number;

type TurnstileRenderOptions = {
  sitekey: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions,
  ) => TurnstileWidgetId;
  reset: (widgetId?: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstilePromise: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstilePromise) {
    return turnstilePromise;
  }

  turnstilePromise = new Promise((resolve, reject) => {
    const resolveTurnstile = () => {
      if (!window.turnstile) {
        return false;
      }

      resolve(window.turnstile);
      return true;
    };

    if (resolveTurnstile()) {
      return;
    }

    const handleLoad = () => {
      if (resolveTurnstile()) {
        return;
      }

      turnstilePromise = null;
      reject(new Error("Turnstile script loaded without exposing window.turnstile."));
    };

    const handleError = () => {
      turnstilePromise = null;
      reject(new Error("Turnstile script failed to load."));
    };

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript instanceof HTMLScriptElement) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.append(script);
  });

  return turnstilePromise;
}

export async function renderTurnstile(
  container: HTMLElement,
  options: TurnstileRenderOptions,
): Promise<TurnstileWidgetId> {
  const turnstile = await loadTurnstile();
  return turnstile.render(container, options);
}

export function resetTurnstileWidget(widgetId?: TurnstileWidgetId): void {
  window.turnstile?.reset(widgetId);
}
