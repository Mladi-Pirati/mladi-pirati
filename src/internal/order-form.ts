export const ORDER_FORM_PATH = "/narocilo";
export const ORDER_API_PATH = "/api/order";

export interface CartItem {
  itemId: string;
  size: string;
  quantity: number;
  name: string;
  price: string;
}

export interface OrderItem {
  itemId: string;
  size: string;
  quantity: number;
}

export interface OrderPayload {
  fullName: string;
  email: string;
  phone: string;
  deliveryType: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingOptionId: string;
  pickupLocationId: string;
  notes: string;
  captchaToken: string;
  items: OrderItem[];
}

export const ORDER_FIELD_NAMES = [
  "fullName",
  "email",
  "phone",
  "address",
  "city",
  "postalCode",
  "country",
  "shippingOptionId",
  "pickupLocationId",
  "notes",
] as const;

export type OrderFieldName = (typeof ORDER_FIELD_NAMES)[number];
export type OrderFieldErrors = Partial<Record<OrderFieldName, string>>;

export function normalizeOrderInput(source: Record<string, unknown>): OrderPayload {
  const rawItems = Array.isArray(source.items) ? source.items : [];

  return {
    fullName: getString(source.fullName),
    email: getString(source.email),
    phone: getString(source.phone),
    deliveryType: getString(source.deliveryType),
    address: getString(source.address),
    city: getString(source.city),
    postalCode: getString(source.postalCode),
    country: getString(source.country),
    shippingOptionId: getString(source.shippingOptionId),
    pickupLocationId: getString(source.pickupLocationId),
    notes: getString(source.notes),
    captchaToken: getString(source.captchaToken),
    items: rawItems
      .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
      .map((i) => ({
        itemId: getString(i.itemId),
        size: getString(i.size),
        quantity:
          typeof i.quantity === "number" && Number.isFinite(i.quantity)
            ? Math.max(0, Math.floor(i.quantity))
            : 0,
      })),
  };
}

export function validateOrderInput(source: Record<string, unknown>): {
  data: OrderPayload | null;
  fieldErrors: OrderFieldErrors;
} {
  const data = normalizeOrderInput(source);
  const fieldErrors: OrderFieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (data.fullName.length < 2) {
    fieldErrors.fullName = "Vnesi polno ime.";
  }

  if (!emailPattern.test(data.email)) {
    fieldErrors.email = "Vnesi veljaven e-poštni naslov.";
  } else if (data.email.length > 160) {
    fieldErrors.email = "E-poštni naslov naj bo krajši od 160 znakov.";
  }

  if (data.phone.length > 0 && data.phone.length < 5) {
    fieldErrors.phone = "Telefonska številka naj vsebuje vsaj 5 znakov.";
  } else if (data.phone.length > 40) {
    fieldErrors.phone = "Telefonska številka naj bo krajša od 40 znakov.";
  }

  if (data.deliveryType === "shipping") {
    if (data.address.length === 0) fieldErrors.address = "Vnesi ulico in hišno številko.";
    if (data.city.length === 0) fieldErrors.city = "Vnesi mesto.";
    if (data.postalCode.length === 0) fieldErrors.postalCode = "Vnesi poštno številko.";
    if (data.country.length === 0) fieldErrors.country = "Vnesi državo.";
    if (data.shippingOptionId.length === 0) fieldErrors.shippingOptionId = "Izberi način dostave.";
  } else if (data.deliveryType === "pickup") {
    if (data.pickupLocationId.length === 0) fieldErrors.pickupLocationId = "Izberi lokacijo prevzema.";
  }

  if (data.notes.length > 500) {
    fieldErrors.notes = "Opomba naj bo krajša od 500 znakov.";
  }

  return {
    data: Object.keys(fieldErrors).length === 0 ? data : null,
    fieldErrors,
  };
}

export function normalizeReturnedFieldErrors(value: unknown): OrderFieldErrors {
  if (!value || typeof value !== "object") return {};

  const normalized: OrderFieldErrors = {};

  for (const fieldName of ORDER_FIELD_NAMES) {
    const fieldValue = (value as Record<string, unknown>)[fieldName];

    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      normalized[fieldName] = fieldValue.trim();
      continue;
    }

    if (
      Array.isArray(fieldValue) &&
      typeof fieldValue[0] === "string" &&
      fieldValue[0].trim() !== ""
    ) {
      normalized[fieldName] = fieldValue[0].trim();
    }
  }

  return normalized;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
