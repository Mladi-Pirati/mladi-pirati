import {
  renderTurnstile,
  resetTurnstileWidget,
  type TurnstileWidgetId,
} from "../shared/turnstile";

const FIELD_NAMES = [
  "fullName",
  "dateOfBirth",
  "placeOfBirth",
  "streetAddress",
  "cityAndPostalCode",
  "residenceRegion",
  "email",
  "phone",
  "participationMode",
  "discordUsername",
  "motivation",
  "consentsToDataProcessing",
  "acceptsStatuteAndProgram",
] as const;

const DEFAULT_SUBMIT_ERROR_MESSAGE =
  "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.";
const DEFAULT_VALIDATION_MESSAGE = "Preveri označena polja in poskusi znova.";
const DEFAULT_RATE_LIMIT_MESSAGE =
  "Oddaja je trenutno omejena. Poskusi znova čez nekaj minut.";
const DEFAULT_CAPTCHA_REQUIRED_MESSAGE =
  "Za nadaljevanje reši varnostni izziv in nato znova oddaj prijavnico.";
const DEFAULT_CAPTCHA_INVALID_MESSAGE =
  "Varnostno preverjanje ni bilo veljavno. Reši ga znova in ponovno oddaj prijavnico.";
const DEFAULT_CAPTCHA_RESUBMIT_MESSAGE =
  "Za ponovno oddajo najprej znova reši varnostni izziv.";
const CAPTCHA_READY_MESSAGE =
  "Varnostni izziv je uspešno rešen. Zdaj znova oddaj prijavnico.";
const CAPTCHA_EXPIRED_MESSAGE =
  "Varnostni izziv je potekel. Reši ga znova in nato oddaj prijavnico.";
const CAPTCHA_ERROR_MESSAGE =
  "Pri varnostnem preverjanju je prišlo do napake. Poskusi znova.";
const CAPTCHA_LOAD_ERROR_MESSAGE =
  "Varnostnega preverjanja trenutno ni mogoče naložiti. Poskusi znova čez nekaj minut.";
const CAPTCHA_MISSING_SITE_KEY_MESSAGE =
  "Varnostno preverjanje trenutno ni na voljo. Poskusi znova čez nekaj minut.";

type JoinFieldName = (typeof FIELD_NAMES)[number];
type StatusTone = "error" | "muted";
type JoinRequestBody = ReturnType<typeof serializeForm>;
type JoinRequestSubmission = JoinRequestBody & { captchaToken?: string };
type DeferredTask = (() => Promise<void>) | null;
type CaptchaStatusMessage = { message: string; tone: StatusTone } | null;

type JoinRequestResponse = {
  code?: "captcha_required" | "captcha_invalid" | string;
  error?: string;
  fieldErrors?: Partial<Record<JoinFieldName, string>>;
  message?: string;
  ok?: boolean;
};

export function initJoinForm(): void {
  const form = document.getElementById("join-request-form");
  const status = document.getElementById("join-form-status");
  const captchaRegion = document.getElementById("join-turnstile-region");
  const captchaStatus = document.getElementById("join-turnstile-status");
  const captchaWidget = document.getElementById("join-turnstile-widget");
  const formShell = document.getElementById("join-form-shell");
  const successPanel = document.getElementById("join-success-panel");

  if (
    !(form instanceof HTMLFormElement) ||
    !(status instanceof HTMLElement) ||
    !(captchaRegion instanceof HTMLElement) ||
    !(captchaStatus instanceof HTMLElement) ||
    !(captchaWidget instanceof HTMLElement) ||
    !(formShell instanceof HTMLElement) ||
    !(successPanel instanceof HTMLElement)
  ) {
    return;
  }

  const turnstileSiteKey = form.dataset.turnstileSiteKey?.trim() ?? "";
  let isSubmitting = false;
  let captchaVisible = !captchaRegion.hidden;
  let captchaToken = "";
  let widgetId: TurnstileWidgetId | null = null;

  const revealCaptchaRegion = () => {
    captchaVisible = true;
    captchaRegion.hidden = false;
  };

  const focusCaptchaRegion = () => {
    window.requestAnimationFrame(() => {
      captchaRegion.focus();
    });
  };

  const ensureCaptchaReady = async (
    message: string,
    tone: StatusTone = "muted",
  ): Promise<boolean> => {
    revealCaptchaRegion();
    focusCaptchaRegion();

    if (!turnstileSiteKey) {
      setStatus(captchaStatus, CAPTCHA_MISSING_SITE_KEY_MESSAGE, "error");
      return false;
    }

    if (widgetId !== null) {
      setStatus(captchaStatus, message, tone);
      return true;
    }

    setStatus(captchaStatus, "Nalagamo varnostno preverjanje…", "muted");

    try {
      widgetId = await renderTurnstile(captchaWidget, {
        sitekey: turnstileSiteKey,
        theme: "dark",
        callback: (token) => {
          captchaToken = token;
          setStatus(captchaStatus, CAPTCHA_READY_MESSAGE, "muted");
        },
        "expired-callback": () => {
          captchaToken = "";
          setStatus(captchaStatus, CAPTCHA_EXPIRED_MESSAGE, "error");
        },
        "error-callback": () => {
          captchaToken = "";
          setStatus(captchaStatus, CAPTCHA_ERROR_MESSAGE, "error");
        },
      });
      setStatus(captchaStatus, message, tone);
      return true;
    } catch {
      setStatus(captchaStatus, CAPTCHA_LOAD_ERROR_MESSAGE, "error");
      return false;
    }
  };

  const promptForCaptcha = async (
    message: string,
    tone: StatusTone = "muted",
  ) => {
    await ensureCaptchaReady(message, tone);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (captchaVisible && captchaToken === "") {
      if (widgetId === null) {
        void promptForCaptcha(DEFAULT_CAPTCHA_REQUIRED_MESSAGE);
      } else {
        setStatus(captchaStatus, DEFAULT_CAPTCHA_REQUIRED_MESSAGE, "error");
        focusCaptchaRegion();
      }

      return;
    }

    clearAllErrors(form);
    setStatus(status, "Pošiljamo prijavnico…", "muted");

    const requestBody = serializeForm(form);
    const requestUsedCaptcha = captchaVisible && captchaToken !== "";
    const submissionBody: JoinRequestSubmission = requestUsedCaptcha
      ? { ...requestBody, captchaToken }
      : requestBody;
    let nextCaptchaStatusAfterReset: CaptchaStatusMessage = requestUsedCaptcha
      ? {
          message: DEFAULT_CAPTCHA_RESUBMIT_MESSAGE,
          tone: "muted",
        }
      : null;
    let focusCaptchaAfterSubmit = false;
    let postSubmitTask: DeferredTask = null;

    isSubmitting = true;
    form.dataset.submitting = "true";
    setSubmittingState(form, true);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionBody),
      });
      const payload = (await readJson(response)) as JoinRequestResponse | null;
      const responseMessage = getResponseMessage(payload);

      if (!response.ok) {
        const fieldErrors = payload?.fieldErrors ?? {};

        if (response.status === 429 && payload?.code === "captcha_required") {
          clearStatus(status);
          postSubmitTask = async () => {
            await promptForCaptcha(
              responseMessage ?? DEFAULT_CAPTCHA_REQUIRED_MESSAGE,
            );
          };
          return;
        }

        if (response.status === 400 && payload?.code === "captcha_invalid") {
          clearStatus(status);
          revealCaptchaRegion();
          nextCaptchaStatusAfterReset = {
            message: responseMessage ?? DEFAULT_CAPTCHA_INVALID_MESSAGE,
            tone: "error",
          };
          focusCaptchaAfterSubmit = true;
          return;
        }

        if (Object.keys(fieldErrors).length > 0) {
          applyFieldErrors(form, fieldErrors);
          setStatus(status, responseMessage ?? DEFAULT_VALIDATION_MESSAGE, "error");
          return;
        }

        if (response.status === 429) {
          setStatus(
            status,
            getRateLimitMessage(response.headers.get("Retry-After")) ??
              responseMessage ??
              DEFAULT_RATE_LIMIT_MESSAGE,
            "error",
          );
          return;
        }

        setStatus(status, responseMessage ?? DEFAULT_SUBMIT_ERROR_MESSAGE, "error");
        return;
      }

      form.reset();
      clearAllErrors(form);
      clearStatus(status);
      clearStatus(captchaStatus);
      nextCaptchaStatusAfterReset = null;
      formShell.hidden = true;
      successPanel.hidden = false;
      successPanel.focus();
      window.history.replaceState({}, "", "/pridruzi-se?submitted=1");
    } catch {
      setStatus(status, DEFAULT_SUBMIT_ERROR_MESSAGE, "error");
    } finally {
      if (requestUsedCaptcha) {
        captchaToken = "";

        if (widgetId !== null) {
          resetTurnstileWidget(widgetId);
        }

        if (nextCaptchaStatusAfterReset && !formShell.hidden) {
          revealCaptchaRegion();
          setStatus(
            captchaStatus,
            nextCaptchaStatusAfterReset.message,
            nextCaptchaStatusAfterReset.tone,
          );
        }
      }

      isSubmitting = false;
      delete form.dataset.submitting;
      setSubmittingState(form, false);

      if (focusCaptchaAfterSubmit) {
        focusCaptchaRegion();
      }

      if (postSubmitTask) {
        void postSubmitTask();
      }
    }
  });

  form.addEventListener("input", (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      clearFieldError(form, target.name as JoinFieldName);
      clearStatus(status);
    }
  });

  form.addEventListener("change", (event) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      clearFieldError(form, target.name as JoinFieldName);
      clearStatus(status);
    }
  });
}

function serializeForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  return {
    fullName: getString(formData, "fullName"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    placeOfBirth: getString(formData, "placeOfBirth"),
    streetAddress: getString(formData, "streetAddress"),
    cityAndPostalCode: getString(formData, "cityAndPostalCode"),
    residenceRegion: getString(formData, "residenceRegion"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    participationMode: getString(formData, "participationMode"),
    discordUsername: getString(formData, "discordUsername"),
    motivation: getString(formData, "motivation"),
    consentsToDataProcessing: formData.get("consentsToDataProcessing") === "true",
    acceptsStatuteAndProgram: formData.get("acceptsStatuteAndProgram") === "true",
  };
}

function getString(formData: FormData, fieldName: JoinFieldName): string {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function applyFieldErrors(
  form: HTMLFormElement,
  fieldErrors: Partial<Record<JoinFieldName, string>>,
): void {
  let firstInvalidControl: HTMLElement | null = null;

  for (const fieldName of FIELD_NAMES) {
    const message = fieldErrors[fieldName];

    if (!message) {
      continue;
    }

    const wrapper = form.querySelector<HTMLElement>(
      `[data-field-wrapper="${fieldName}"]`,
    );
    const error = form.querySelector<HTMLElement>(`[data-error-for="${fieldName}"]`);
    const controls = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`[name="${fieldName}"]`);

    if (wrapper) {
      wrapper.dataset.invalid = "true";
    }

    if (error) {
      error.textContent = message;
    }

    controls.forEach((control) => {
      control.setAttribute("aria-invalid", "true");
    });

    if (!firstInvalidControl) {
      firstInvalidControl = controls[0] ?? wrapper;
    }
  }

  firstInvalidControl?.focus();
}

function clearAllErrors(form: HTMLFormElement): void {
  FIELD_NAMES.forEach((fieldName) => {
    clearFieldError(form, fieldName);
  });
}

function clearFieldError(form: HTMLFormElement, fieldName: JoinFieldName): void {
  const wrapper = form.querySelector<HTMLElement>(`[data-field-wrapper="${fieldName}"]`);
  const error = form.querySelector<HTMLElement>(`[data-error-for="${fieldName}"]`);
  const controls = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(`[name="${fieldName}"]`);

  if (wrapper) {
    delete wrapper.dataset.invalid;
  }

  if (error) {
    error.textContent = "";
  }

  controls.forEach((control) => {
    control.removeAttribute("aria-invalid");
  });
}

function setSubmittingState(form: HTMLFormElement, disabled: boolean): void {
  form
    .querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("button, input, select, textarea")
    .forEach((element) => {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLButtonElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.disabled = disabled;
      }
    });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getResponseMessage(payload: JoinRequestResponse | null): string | null {
  const message = payload?.message ?? payload?.error;

  if (typeof message !== "string") {
    return null;
  }

  const normalizedMessage = message.trim();
  return normalizedMessage === "" ? null : normalizedMessage;
}

function getRateLimitMessage(retryAfter: string | null): string | null {
  const retryDelaySeconds = parseRetryAfterSeconds(retryAfter);

  if (retryDelaySeconds === null) {
    return null;
  }

  return `Oddaja je trenutno omejena. Poskusi znova čez približno ${formatRetryDelay(retryDelaySeconds)}.`;
}

function parseRetryAfterSeconds(retryAfter: string | null): number | null {
  if (!retryAfter) {
    return null;
  }

  const trimmedValue = retryAfter.trim();

  if (trimmedValue === "") {
    return null;
  }

  if (/^\d+$/.test(trimmedValue)) {
    return Math.max(0, Number.parseInt(trimmedValue, 10));
  }

  const retryDate = Date.parse(trimmedValue);

  if (Number.isNaN(retryDate)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function formatRetryDelay(retryDelaySeconds: number): string {
  if (retryDelaySeconds < 60) {
    return `${Math.max(1, retryDelaySeconds)} s`;
  }

  if (retryDelaySeconds < 3600) {
    return `${Math.ceil(retryDelaySeconds / 60)} min`;
  }

  return `${Math.ceil(retryDelaySeconds / 3600)} h`;
}

function setStatus(
  status: HTMLElement,
  message: string,
  tone: "error" | "muted",
): void {
  status.textContent = message;
  status.dataset.tone = tone;
}

function clearStatus(status: HTMLElement): void {
  status.textContent = "";
  delete status.dataset.tone;
}
