type SignupFieldName =
  | "first_name"
  | "last_name"
  | "email"
  | "birth_year"
  | "city"
  | "motivation";

type ValidatableControl = HTMLInputElement | HTMLTextAreaElement;
type StatusTone = "error" | "muted" | "success";

const FIELD_ORDER: SignupFieldName[] = [
  "first_name",
  "last_name",
  "email",
  "birth_year",
  "city",
  "motivation",
];

export function initSignupForm(): void {
  const form = document.getElementById("signup-form");
  const consentPanel = document.getElementById("form-consent");
  const consentSubmit = document.getElementById("consent-submit");
  const consentBack = document.getElementById("consent-back");
  const consentCheckbox = document.getElementById("consent-data");
  const primarySubmit = document.getElementById("primary-submit");
  const status = document.getElementById("form-status");

  if (
    !(form instanceof HTMLFormElement) ||
    !(consentPanel instanceof HTMLElement) ||
    !(consentSubmit instanceof HTMLButtonElement) ||
    !(consentBack instanceof HTMLButtonElement) ||
    !(consentCheckbox instanceof HTMLInputElement) ||
    !(primarySubmit instanceof HTMLButtonElement) ||
    !(status instanceof HTMLElement)
  ) {
    return;
  }

  let isSubmitting = false;

  form.classList.add("is-enhanced");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validatePrimaryFields(form, status)) {
      return;
    }

    clearStatus(status);
    form.classList.add("show-consent");
    consentCheckbox.focus();
  });

  form.addEventListener("input", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.name === "consent_data" && target instanceof HTMLInputElement) {
      clearCheckboxError(target);
      clearStatus(status);
      return;
    }

    const control = target;

    if (control.name === "birth_year" && control instanceof HTMLInputElement) {
      applyBirthYearValidity(control);
    }

    if (control.checkValidity()) {
      clearFieldError(control);
      clearStatus(status);
    }
  });

  consentBack.addEventListener("click", () => {
    form.classList.remove("show-consent");
    primarySubmit.focus();
  });

  consentSubmit.addEventListener("click", async () => {
    if (isSubmitting) {
      return;
    }

    if (!validateConsent(consentCheckbox, status)) {
      return;
    }

    if (!form.action) {
      setStatus(
        status,
        "Obrazec se ni nastavljen. Dodaj PUBLIC_SIGNUP_ENDPOINT, potem bo oddaja delovala.",
        "error",
      );
      return;
    }

    const honeypot = form.elements.namedItem("company");

    if (honeypot instanceof HTMLInputElement && honeypot.value.trim() !== "") {
      form.reset();
      form.classList.remove("show-consent");
      setStatus(status, "Hvala! Prijavo smo prejeli.", "success");
      return;
    }

    isSubmitting = true;
    form.classList.add("is-submitting");
    primarySubmit.disabled = true;
    consentSubmit.disabled = true;
    setStatus(status, "Posiljamo pristopnico…", "muted");

    const payload = new FormData(form);
    payload.set("consent_data", consentCheckbox.checked ? "yes" : "");

    try {
      const response = await fetch(form.action, {
        method: (form.method || "POST").toUpperCase(),
        body: payload,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Signup request failed: ${response.status}`);
      }

      form.reset();
      form.classList.remove("show-consent");
      clearAllErrors(form);
      setStatus(
        status,
        "Hvala! Prijavnico smo prejeli. Kmalu se oglasimo z naslednjimi koraki.",
        "success",
      );
      primarySubmit.focus();
    } catch {
      setStatus(
        status,
        "Oddaja trenutno ni uspela. Poskusi znova cez nekaj minut ali nam pisi neposredno.",
        "error",
      );
      consentSubmit.focus();
    } finally {
      isSubmitting = false;
      form.classList.remove("is-submitting");
      primarySubmit.disabled = false;
      consentSubmit.disabled = false;
    }
  });
}

function validatePrimaryFields(
  form: HTMLFormElement,
  status: HTMLElement,
): boolean {
  let firstInvalidFieldName: SignupFieldName | null = null;

  FIELD_ORDER.forEach((fieldName) => {
    const control = getField(form, fieldName);

    if (!control) {
      return;
    }

    const isValid = validateControl(control);

    if (!isValid && !firstInvalidFieldName) {
      firstInvalidFieldName = fieldName;
    }
  });

  if (firstInvalidFieldName) {
    const firstInvalidControl = getField(form, firstInvalidFieldName);
    firstInvalidControl?.focus();
    setStatus(status, "Popravi oznacena polja in poskusi znova.", "error");
    return false;
  }

  return true;
}

function validateConsent(
  checkbox: HTMLInputElement,
  status: HTMLElement,
): boolean {
  if (checkbox.checked) {
    clearCheckboxError(checkbox);
    clearStatus(status);
    return true;
  }

  const error = document.getElementById("consent-data-error");

  if (error instanceof HTMLElement) {
    error.textContent = "Za oddajo obrazca moras potrditi soglasje.";
  }

  checkbox.setAttribute("aria-invalid", "true");
  checkbox.closest(".consent-check")?.classList.add("is-invalid");
  checkbox.focus();
  setStatus(status, "Potrdi soglasje, potem lahko oddamo obrazec.", "error");

  return false;
}

function validateControl(control: ValidatableControl): boolean {
  if (control instanceof HTMLInputElement && control.name === "birth_year") {
    applyBirthYearValidity(control);
  } else {
    control.setCustomValidity("");
  }

  const isValid = control.checkValidity();

  if (isValid) {
    clearFieldError(control);
    return true;
  }

  setFieldError(control, control.validationMessage);
  return false;
}

function applyBirthYearValidity(control: HTMLInputElement): void {
  const value = control.value.trim();

  if (value === "") {
    control.setCustomValidity("Vnesi letnik rojstva.");
    return;
  }

  const year = Number.parseInt(value, 10);
  const minYear = Number.parseInt(control.min || "0", 10);
  const maxYear = Number.parseInt(control.max || "9999", 10);

  if (!Number.isInteger(year) || value.length !== 4) {
    control.setCustomValidity("Vnesi stirimestni letnik rojstva.");
    return;
  }

  if (year < minYear || year > maxYear) {
    control.setCustomValidity(`Vnesi letnik med ${minYear} in ${maxYear}.`);
    return;
  }

  control.setCustomValidity("");
}

function getField(
  form: HTMLFormElement,
  fieldName: SignupFieldName,
): ValidatableControl | null {
  const control = form.elements.namedItem(fieldName);

  if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
    return control;
  }

  return null;
}

function setFieldError(control: ValidatableControl, message: string): void {
  const error = document.querySelector<HTMLElement>(
    `[data-error-for="${control.name}"]`,
  );

  if (error) {
    error.textContent = message;
  }

  control.setAttribute("aria-invalid", "true");
  control.closest("[data-field-wrapper]")?.classList.add("is-invalid");
}

function clearFieldError(control: ValidatableControl): void {
  const error = document.querySelector<HTMLElement>(
    `[data-error-for="${control.name}"]`,
  );

  if (error) {
    error.textContent = "";
  }

  control.removeAttribute("aria-invalid");
  control.closest("[data-field-wrapper]")?.classList.remove("is-invalid");
}

function clearCheckboxError(checkbox: HTMLInputElement): void {
  const error = document.getElementById("consent_data-error");

  if (error instanceof HTMLElement) {
    error.textContent = "";
  }

  checkbox.removeAttribute("aria-invalid");
  checkbox.closest(".consent-check")?.classList.remove("is-invalid");
}

function clearAllErrors(form: HTMLFormElement): void {
  FIELD_ORDER.forEach((fieldName) => {
    const control = getField(form, fieldName);

    if (control) {
      clearFieldError(control);
    }
  });

  const consentCheckbox = form.elements.namedItem("consent_data");

  if (consentCheckbox instanceof HTMLInputElement) {
    clearCheckboxError(consentCheckbox);
  }
}

function setStatus(
  status: HTMLElement,
  message: string,
  tone: StatusTone,
): void {
  status.textContent = message;
  status.classList.remove("is-error", "is-muted", "is-success");
  status.classList.add(`is-${tone}`);
}

function clearStatus(status: HTMLElement): void {
  status.textContent = "";
  status.classList.remove("is-error", "is-muted", "is-success");
}
