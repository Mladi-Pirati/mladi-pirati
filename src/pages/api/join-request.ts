import type { APIRoute } from "astro";

import {
  JOIN_FORM_PATH,
  normalizeReturnedFieldErrors,
  validateJoinRequestInput,
} from "../../internal/join-form";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

export const POST: APIRoute = async ({ request }) => {
  const prefersHtml = acceptsHtml(request);
  const parsedBody = await readIncomingBody(request);

  if (!parsedBody) {
    return respondWithError(
      prefersHtml,
      400,
      "Oddaja ni uspela zaradi neveljavnih podatkov.",
    );
  }

  const { data, fieldErrors } = validateJoinRequestInput(parsedBody);

  if (!data) {
    return respondWithError(
      prefersHtml,
      400,
      "Preveri označena polja in poskusi znova.",
      fieldErrors,
    );
  }

  const receiverEndpoint =
    import.meta.env.APPLICATIONS_RECEIVER_MEMBERSHIP_ENDPOINT?.trim();

  if (!receiverEndpoint) {
    return respondWithError(
      prefersHtml,
      500,
      "Strežnik trenutno ni pravilno nastavljen za oddajo prijav.",
    );
  }

  try {
    const receiverResponse = await fetch(receiverEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!receiverResponse.ok) {
      const responseBody = await readJson(receiverResponse);
      const normalizedFieldErrors = normalizeReturnedFieldErrors(
        responseBody?.fieldErrors,
      );
      const hasFieldErrors = Object.keys(normalizedFieldErrors).length > 0;

      return respondWithError(
        prefersHtml,
        hasFieldErrors ? 400 : 502,
        hasFieldErrors
          ? "Preveri označena polja in poskusi znova."
          : "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.",
        normalizedFieldErrors,
      );
    }

    if (prefersHtml) {
      return redirectToForm("submitted=1");
    }

    return jsonResponse({ ok: true }, 201);
  } catch {
    return respondWithError(
      prefersHtml,
      502,
      "Oddaja trenutno ni uspela. Poskusi znova čez nekaj minut.",
    );
  }
};

function acceptsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

async function readIncomingBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      return body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const body: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      body[key] = typeof value === "string" ? value : value.name;
    }

    return body;
  }

  return null;
}

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

function respondWithError(
  prefersHtml: boolean,
  status: number,
  error: string,
  fieldErrors?: Record<string, string>,
): Response {
  if (prefersHtml) {
    const searchParams = new URLSearchParams({ error: "1" });

    if (status === 400 && Object.keys(fieldErrors ?? {}).length > 0) {
      searchParams.set("reason", "validation");
    }

    return redirectToForm(searchParams.toString());
  }

  return jsonResponse(
    {
      ok: false,
      error,
      fieldErrors: fieldErrors ?? {},
    },
    status,
  );
}

function redirectToForm(query: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
      Location: `${JOIN_FORM_PATH}?${query}`,
    },
  });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}
