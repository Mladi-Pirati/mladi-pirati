import type { CartItem, OrderFieldName } from "../../internal/order-form";
import { ORDER_FIELD_NAMES } from "../../internal/order-form";
import {
  renderTurnstile,
  resetTurnstileWidget,
  type TurnstileWidgetId,
} from "../shared/turnstile";

const CART_KEY = "mp_cart";

const DELIVERY_BTN_ACTIVE =
  "flex-1 py-2.5 font-mono text-xs uppercase tracking-widest bg-accent text-black transition-colors";
const DELIVERY_BTN_INACTIVE =
  "flex-1 py-2.5 font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text hover:bg-white/[0.05]";

const DEFAULT_SUBMIT_ERROR =
  "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.";
const DEFAULT_CAPTCHA_REQUIRED =
  "Za nadaljevanje reši varnostni izziv in nato znova oddaj naročilo.";
const DEFAULT_CAPTCHA_INVALID =
  "Varnostno preverjanje ni bilo veljavno. Reši ga znova in ponovno oddaj naročilo.";
const DEFAULT_CAPTCHA_RESUBMIT =
  "Za ponovno oddajo najprej znova reši varnostni izziv.";
const CAPTCHA_READY = "Varnostni izziv je uspešno rešen. Zdaj znova oddaj naročilo.";
const CAPTCHA_EXPIRED = "Varnostni izziv je potekel. Reši ga znova in nato oddaj naročilo.";
const CAPTCHA_ERROR = "Pri varnostnem preverjanju je prišlo do napake. Poskusi znova.";
const CAPTCHA_LOAD_ERROR =
  "Varnostnega preverjanja trenutno ni mogoče naložiti. Poskusi znova čez nekaj minut.";
const CAPTCHA_MISSING_KEY =
  "Varnostno preverjanje trenutno ni na voljo. Poskusi znova čez nekaj minut.";

type StatusTone = "error" | "muted";

export function initCheckoutPage(): void {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("status") === "success") {
    showSuccessState(urlParams.get("orderId") ?? "");
    return;
  }

  let cart: CartItem[];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) {
      window.location.replace("/shop");
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.location.replace("/shop");
      return;
    }
    cart = parsed as CartItem[];
  } catch {
    window.location.replace("/shop");
    return;
  }

  populateOrderSummary(cart);
  initDeliveryToggle();
  initFormSubmission(cart);
}

function populateOrderSummary(cart: CartItem[]): void {
  const el = document.getElementById("checkout-summary");
  if (!el) return;

  let total = 0;
  const rows = cart.map((item) => {
    const subtotal = parseFloat(item.price) * item.quantity;
    total += subtotal;
    return `<div class="flex justify-between gap-4 py-1.5 font-mono text-sm">
      <span class="text-text">${item.name}<span class="text-text-muted"> — ${item.size} × ${item.quantity}</span></span>
      <span class="text-accent shrink-0">${subtotal.toFixed(2).replace(".", ",")} €</span>
    </div>`;
  });

  el.innerHTML =
    rows.join("") +
    `<div class="mt-2 flex justify-between border-t border-border pt-2 font-mono text-sm font-bold">
      <span class="text-text">Skupaj</span>
      <span class="text-accent">${total.toFixed(2).replace(".", ",")} €</span>
    </div>`;
}

function initDeliveryToggle(): void {
  const shippingBtn = document.getElementById("delivery-btn-shipping");
  const pickupBtn = document.getElementById("delivery-btn-pickup");
  const shippingSection = document.getElementById("shipping-section");
  const pickupSection = document.getElementById("pickup-section");
  const deliveryInput = document.getElementById(
    "delivery-type-input",
  ) as HTMLInputElement | null;

  if (
    !shippingBtn ||
    !pickupBtn ||
    !shippingSection ||
    !pickupSection ||
    !deliveryInput
  )
    return;

  function setDeliveryType(type: "shipping" | "pickup"): void {
    deliveryInput!.value = type;
    if (type === "shipping") {
      shippingBtn!.className = DELIVERY_BTN_ACTIVE;
      pickupBtn!.className = DELIVERY_BTN_INACTIVE;
      (shippingSection as HTMLElement).hidden = false;
      (pickupSection as HTMLElement).hidden = true;
    } else {
      pickupBtn!.className = DELIVERY_BTN_ACTIVE;
      shippingBtn!.className = DELIVERY_BTN_INACTIVE;
      (pickupSection as HTMLElement).hidden = false;
      (shippingSection as HTMLElement).hidden = true;
    }
  }

  shippingBtn.addEventListener("click", () => setDeliveryType("shipping"));
  pickupBtn.addEventListener("click", () => setDeliveryType("pickup"));
}

function initFormSubmission(cart: CartItem[]): void {
  const form = document.getElementById("checkout-form");
  const status = document.getElementById("checkout-status");
  const captchaRegion = document.getElementById("checkout-captcha-region");
  const captchaStatus = document.getElementById("checkout-captcha-status");
  const captchaWidget = document.getElementById("checkout-captcha-widget");
  const formShell = document.getElementById("checkout-form-shell");
  const successPanel = document.getElementById("checkout-success-panel");

  if (
    !(form instanceof HTMLFormElement) ||
    !(status instanceof HTMLElement) ||
    !(captchaRegion instanceof HTMLElement) ||
    !(captchaStatus instanceof HTMLElement) ||
    !(captchaWidget instanceof HTMLElement) ||
    !(formShell instanceof HTMLElement) ||
    !(successPanel instanceof HTMLElement)
  )
    return;

  const turnstileSiteKey = form.dataset.turnstileSiteKey?.trim() ?? "";
  let isSubmitting = false;
  let captchaVisible = !captchaRegion.hidden;
  let captchaToken = "";
  let widgetId: TurnstileWidgetId | null = null;

  const revealCaptcha = () => {
    captchaVisible = true;
    captchaRegion.hidden = false;
  };

  const focusCaptcha = () => {
    window.requestAnimationFrame(() => captchaRegion.focus());
  };

  const ensureCaptchaReady = async (
    message: string,
    tone: StatusTone = "muted",
  ): Promise<boolean> => {
    revealCaptcha();
    focusCaptcha();

    if (!turnstileSiteKey) {
      setStatus(captchaStatus, CAPTCHA_MISSING_KEY, "error");
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
          setStatus(captchaStatus, CAPTCHA_READY, "muted");
        },
        "expired-callback": () => {
          captchaToken = "";
          setStatus(captchaStatus, CAPTCHA_EXPIRED, "error");
        },
        "error-callback": () => {
          captchaToken = "";
          setStatus(captchaStatus, CAPTCHA_ERROR, "error");
        },
      });
      setStatus(captchaStatus, message, tone);
      return true;
    } catch {
      setStatus(captchaStatus, CAPTCHA_LOAD_ERROR, "error");
      return false;
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (captchaVisible && captchaToken === "") {
      if (widgetId === null) {
        void ensureCaptchaReady(DEFAULT_CAPTCHA_REQUIRED);
      } else {
        setStatus(captchaStatus, DEFAULT_CAPTCHA_REQUIRED, "error");
        focusCaptcha();
      }
      return;
    }

    clearAllErrors(form);
    setStatus(status, "Pošiljamo naročilo…", "muted");

    const deliveryInput = document.getElementById(
      "delivery-type-input",
    ) as HTMLInputElement | null;
    const deliveryType = (deliveryInput?.value ?? "shipping") as
      | "shipping"
      | "pickup";

    const requestBody = serializeForm(form, cart, deliveryType);
    const requestUsedCaptcha = captchaVisible && captchaToken !== "";
    const submissionPayload = requestUsedCaptcha
      ? { ...requestBody, captchaToken }
      : requestBody;

    let nextCaptchaStatus: { message: string; tone: StatusTone } | null =
      requestUsedCaptcha
        ? { message: DEFAULT_CAPTCHA_RESUBMIT, tone: "muted" }
        : null;
    let focusCaptchaAfter = false;
    let postTask: (() => Promise<void>) | null = null;

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
        body: JSON.stringify(submissionPayload),
      });
      const responseBody = (await readJson(response)) as Record<string, unknown> | null;

      if (!response.ok) {
        const fieldErrors = (responseBody?.fieldErrors ?? {}) as Partial<
          Record<OrderFieldName, string>
        >;

        if (response.status === 429 && responseBody?.code === "captcha_required") {
          clearStatus(status);
          postTask = async () => {
            await ensureCaptchaReady(DEFAULT_CAPTCHA_REQUIRED);
          };
          return;
        }

        if (response.status === 400 && responseBody?.code === "captcha_invalid") {
          clearStatus(status);
          revealCaptcha();
          nextCaptchaStatus = {
            message: DEFAULT_CAPTCHA_INVALID,
            tone: "error",
          };
          focusCaptchaAfter = true;
          return;
        }

        if (Object.keys(fieldErrors).length > 0) {
          applyFieldErrors(form, fieldErrors);
          setStatus(
            status,
            typeof responseBody?.error === "string" && responseBody.error.trim()
              ? responseBody.error.trim()
              : DEFAULT_SUBMIT_ERROR,
            "error",
          );
          return;
        }

        setStatus(
          status,
          typeof responseBody?.error === "string" && responseBody.error.trim()
            ? responseBody.error.trim()
            : DEFAULT_SUBMIT_ERROR,
          "error",
        );
        return;
      }

      const orderId =
        typeof responseBody?.orderId === "string" ? responseBody.orderId : "";
      sessionStorage.removeItem(CART_KEY);
      window.history.replaceState(
        {},
        "",
        `/narocilo?status=success&orderId=${orderId}`,
      );
      showSuccessState(orderId);
    } catch {
      setStatus(status, DEFAULT_SUBMIT_ERROR, "error");
    } finally {
      if (requestUsedCaptcha) {
        captchaToken = "";
        if (widgetId !== null) resetTurnstileWidget(widgetId);
        if (nextCaptchaStatus && !formShell.hidden) {
          revealCaptcha();
          setStatus(
            captchaStatus,
            nextCaptchaStatus.message,
            nextCaptchaStatus.tone,
          );
        }
      }

      isSubmitting = false;
      delete form.dataset.submitting;
      setSubmittingState(form, false);

      if (focusCaptchaAfter) focusCaptcha();
      if (postTask) void postTask();
    }
  });

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      clearFieldError(form, target.name as OrderFieldName);
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
      clearFieldError(form, target.name as OrderFieldName);
      clearStatus(status);
    }
  });
}

function showSuccessState(orderId: string): void {
  const formShell = document.getElementById("checkout-form-shell");
  const successPanel = document.getElementById("checkout-success-panel");
  const orderIdEl = document.getElementById("checkout-order-id");
  const orderIdRow = document.getElementById("checkout-order-id-row");

  if (formShell) formShell.hidden = true;
  if (successPanel) {
    successPanel.hidden = false;
    successPanel.focus();
  }
  if (orderId && orderIdEl && orderIdRow) {
    orderIdEl.textContent = orderId;
    orderIdRow.hidden = false;
  }
}

function serializeForm(
  form: HTMLFormElement,
  cart: CartItem[],
  deliveryType: "shipping" | "pickup",
) {
  const fd = new FormData(form);
  const get = (key: string) => {
    const v = fd.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  return {
    fullName: get("fullName"),
    email: get("email"),
    phone: get("phone"),
    deliveryType,
    address: get("address"),
    city: get("city"),
    postalCode: get("postalCode"),
    country: get("country"),
    shippingOptionId: get("shippingOptionId"),
    pickupLocationId: get("pickupLocationId"),
    notes: get("notes"),
    items: cart.map((c) => ({
      itemId: c.itemId,
      size: c.size,
      quantity: c.quantity,
    })),
  };
}

function applyFieldErrors(
  form: HTMLFormElement,
  fieldErrors: Partial<Record<OrderFieldName, string>>,
): void {
  let firstInvalidControl: HTMLElement | null = null;

  for (const fieldName of ORDER_FIELD_NAMES) {
    const message = fieldErrors[fieldName];
    if (!message) continue;

    const wrapper = form.querySelector<HTMLElement>(
      `[data-field-wrapper="${fieldName}"]`,
    );
    const error = form.querySelector<HTMLElement>(
      `[data-error-for="${fieldName}"]`,
    );
    const controls = form.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(`[name="${fieldName}"]`);

    if (wrapper) wrapper.dataset.invalid = "true";
    if (error) error.textContent = message;
    controls.forEach((c) => c.setAttribute("aria-invalid", "true"));

    if (!firstInvalidControl) {
      firstInvalidControl = controls[0] ?? wrapper ?? null;
    }
  }

  firstInvalidControl?.focus();
}

function clearAllErrors(form: HTMLFormElement): void {
  for (const fieldName of ORDER_FIELD_NAMES) {
    clearFieldError(form, fieldName);
  }
}

function clearFieldError(form: HTMLFormElement, fieldName: OrderFieldName): void {
  const wrapper = form.querySelector<HTMLElement>(
    `[data-field-wrapper="${fieldName}"]`,
  );
  const error = form.querySelector<HTMLElement>(
    `[data-error-for="${fieldName}"]`,
  );
  const controls = form.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >(`[name="${fieldName}"]`);

  if (wrapper) delete wrapper.dataset.invalid;
  if (error) error.textContent = "";
  controls.forEach((c) => c.removeAttribute("aria-invalid"));
}

function setSubmittingState(form: HTMLFormElement, disabled: boolean): void {
  form
    .querySelectorAll<
      HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("button, input, select, textarea")
    .forEach((el) => {
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLButtonElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.disabled = disabled;
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
  el: HTMLElement,
  message: string,
  tone: StatusTone,
): void {
  el.textContent = message;
  el.dataset.tone = tone;
}

function clearStatus(el: HTMLElement): void {
  el.textContent = "";
  delete el.dataset.tone;
}
