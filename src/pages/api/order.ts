import type { APIRoute } from "astro";

import { validateOrderInput } from "../../internal/order-form";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export const POST: APIRoute = async ({ request }) => {
  let parsedBody: Record<string, unknown> | null = null;

  try {
    const body = await request.json();
    if (body && typeof body === "object") {
      parsedBody = body as Record<string, unknown>;
    }
  } catch {
    parsedBody = null;
  }

  if (!parsedBody) {
    return jsonResponse({ error: "Neveljavni podatki." }, 400);
  }

  const { data, fieldErrors } = validateOrderInput(parsedBody);

  if (!data) {
    return jsonResponse(
      { error: "Preveri označena polja in poskusi znova.", fieldErrors },
      400,
    );
  }

  const quartermasterApi = import.meta.env.QUARTERMASTER_API?.trim();

  if (!quartermasterApi) {
    return jsonResponse(
      { error: "Strežnik trenutno ni pravilno nastavljen za oddajo naročil." },
      500,
    );
  }

  try {
    const qResponse = await fetch(`${quartermasterApi}/api/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (qResponse.status === 201) {
      const body = await readJson(qResponse);
      return jsonResponse({ orderId: body?.orderId ?? null }, 201);
    }

    if (qResponse.status === 429) {
      const retryAfter = qResponse.headers.get("Retry-After");
      return new Response(JSON.stringify({ code: "captcha_required" }), {
        status: 429,
        headers: {
          ...JSON_HEADERS,
          ...(retryAfter ? { "Retry-After": retryAfter } : {}),
        },
      });
    }

    const errorBody = await readJson(qResponse);

    if (errorBody?.code === "captcha_invalid") {
      return jsonResponse({ code: "captcha_invalid" }, 400);
    }

    return jsonResponse(
      {
        error:
          typeof errorBody?.error === "string" && errorBody.error.trim()
            ? errorBody.error.trim()
            : "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.",
      },
      qResponse.status >= 400 && qResponse.status < 500 ? 400 : 502,
    );
  } catch {
    return jsonResponse(
      { error: "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut." },
      502,
    );
  }
};

async function readJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  try {
    const value = await response.json();
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
