const FIELD_NAMES = [
  "fullName",
  "dateOfBirth",
  "birthPlace",
  "streetAddress",
  "cityPostalCode",
  "region",
  "email",
  "phone",
  "participationMode",
  "discordUsername",
  "consentDataProcessing",
  "acceptStatuteAndProgram",
] as const;

type JoinFieldName = (typeof FIELD_NAMES)[number];

type JoinRequestResponse = {
  error?: string;
  fieldErrors?: Partial<Record<JoinFieldName, string>>;
  ok?: boolean;
};

export function initJoinForm(): void {
  const form = document.getElementById("join-request-form");
  const status = document.getElementById("join-form-status");
  const formShell = document.getElementById("join-form-shell");
  const successPanel = document.getElementById("join-success-panel");

  if (
    !(form instanceof HTMLFormElement) ||
    !(status instanceof HTMLElement) ||
    !(formShell instanceof HTMLElement) ||
    !(successPanel instanceof HTMLElement)
  ) {
    return;
  }

  let isSubmitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearAllErrors(form);
    setStatus(status, "Pošiljamo prijavnico…", "muted");

    isSubmitting = true;
    form.classList.add("is-submitting");
    setSubmittingState(form, true);

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serializeForm(form)),
      });
      const payload = (await readJson(response)) as JoinRequestResponse | null;

      if (!response.ok) {
        const fieldErrors = payload?.fieldErrors ?? {};

        if (Object.keys(fieldErrors).length > 0) {
          applyFieldErrors(form, fieldErrors);
          setStatus(status, payload?.error ?? "Preveri označena polja in poskusi znova.", "error");
        } else {
          setStatus(
            status,
            payload?.error ?? "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.",
            "error",
          );
        }

        return;
      }

      form.reset();
      clearAllErrors(form);
      clearStatus(status);
      formShell.hidden = true;
      successPanel.hidden = false;
      successPanel.focus();
      window.history.replaceState({}, "", "/pridruzi-se?submitted=1");
    } catch {
      setStatus(
        status,
        "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.",
        "error",
      );
    } finally {
      isSubmitting = false;
      form.classList.remove("is-submitting");
      setSubmittingState(form, false);
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
    birthPlace: getString(formData, "birthPlace"),
    streetAddress: getString(formData, "streetAddress"),
    cityPostalCode: getString(formData, "cityPostalCode"),
    region: getString(formData, "region"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    participationMode: getString(formData, "participationMode"),
    discordUsername: getString(formData, "discordUsername"),
    consentDataProcessing: formData.get("consentDataProcessing") === "true",
    acceptStatuteAndProgram: formData.get("acceptStatuteAndProgram") === "true",
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
      wrapper.classList.add("is-invalid");
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

  wrapper?.classList.remove("is-invalid");

  if (error) {
    error.textContent = "";
  }

  controls.forEach((control) => {
    control.removeAttribute("aria-invalid");
  });
}

function setSubmittingState(form: HTMLFormElement, disabled: boolean): void {
  form
    .querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(
      "button, input, select",
    )
    .forEach((element) => {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLButtonElement ||
        element instanceof HTMLSelectElement
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

function setStatus(
  status: HTMLElement,
  message: string,
  tone: "error" | "muted",
): void {
  status.textContent = message;
  status.classList.remove("is-error", "is-muted");
  status.classList.add(`is-${tone}`);
}

function clearStatus(status: HTMLElement): void {
  status.textContent = "";
  status.classList.remove("is-error", "is-muted");
}
