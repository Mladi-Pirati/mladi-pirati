export const JOIN_FORM_PATH = "/pridruzi-se";
export const JOIN_REQUEST_API_PATH = "/api/join-request";

export const STATUTE_URL = "https://next.piratskastranka.si/s/bcpkRR2PrjcYpDs";
export const PROGRAM_URL = "https://wiki.piratskastranka.si/wiki/Glavna_stran";

export const REGIONS = [
  "Pomurska",
  "Podravska",
  "Koroška",
  "Savinjska",
  "Zasavska",
  "Posavska",
  "Jugovzhodna Slovenija",
  "Osrednjeslovenska",
  "Gorenjska",
  "Primorsko-notranjska",
  "Goriška",
  "Obalno-kraška",
] as const;

export const PARTICIPATION_MODES = [
  "Podpornik (prejemaš redne novice o delovanju ter vabila na dogodke)",
  "Aktiven član (se aktivno udejstvuješ)",
] as const;

export const JOIN_FORM_INTRO = [
  "S to prijavnico se včlaniš v Mlade Pirate, mladinsko organizacijo Piratske stranke Slovenije.",
  "Če si mlajši/-a od 18 let, ti bomo poslali obrazec s soglasjem staršev.",
] as const;

export const JOIN_FORM_SUCCESS_COPY = [
  "Tvoja prijavnica je bila uspešno oddana. Upravni odbor jo bo pregledal in te v kratkem obvestil o sprejemu v članstvo.",
  "Če si mlajši/-a od 18 let, ti bomo poslali obrazec s soglasjem staršev. Brez tega obrazca članstvo ne more biti potrjeno.",
  "Do takrat te vabimo, da nas spremljaš na naših kanalih in se pridružiš naši Discord skupini.",
] as const;

export const JOIN_FIELD_NAMES = [
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

export type JoinRequestFieldName = (typeof JOIN_FIELD_NAMES)[number];
export type RegionOption = (typeof REGIONS)[number];
export type ParticipationModeOption = (typeof PARTICIPATION_MODES)[number];

export interface JoinRequestPayload {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  streetAddress: string;
  cityAndPostalCode: string;
  residenceRegion: string;
  email: string;
  phone: string;
  participationMode: string;
  discordUsername: string;
  motivation: string;
  consentsToDataProcessing: boolean;
  acceptsStatuteAndProgram: boolean;
}

export type JoinRequestFieldErrors = Partial<
  Record<JoinRequestFieldName, string>
>;

export function normalizeJoinRequestInput(
  source: Record<string, unknown>,
): JoinRequestPayload {
  return {
    fullName: getString(source.fullName),
    dateOfBirth: getString(source.dateOfBirth),
    placeOfBirth: getString(source.placeOfBirth),
    streetAddress: getString(source.streetAddress),
    cityAndPostalCode: getString(source.cityAndPostalCode),
    residenceRegion: getString(source.residenceRegion),
    email: getString(source.email),
    phone: getString(source.phone),
    participationMode: getString(source.participationMode),
    discordUsername: getString(source.discordUsername),
    motivation: getString(source.motivation),
    consentsToDataProcessing: getBoolean(source.consentsToDataProcessing),
    acceptsStatuteAndProgram: getBoolean(source.acceptsStatuteAndProgram),
  };
}

export function validateJoinRequestInput(
  source: Record<string, unknown>,
): { data: JoinRequestPayload | null; fieldErrors: JoinRequestFieldErrors } {
  const data = normalizeJoinRequestInput(source);
  const fieldErrors: JoinRequestFieldErrors = {};
  const birthDate = parseIsoDate(data.dateOfBirth);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (data.fullName.length < 2) {
    fieldErrors.fullName = "Vnesi ime in priimek.";
  } else if (data.fullName.length > 160) {
    fieldErrors.fullName = "Ime in priimek naj bo krajše od 160 znakov.";
  }

  if (!birthDate) {
    fieldErrors.dateOfBirth = "Vnesi veljaven datum rojstva.";
  }

  if (data.placeOfBirth.length < 2) {
    fieldErrors.placeOfBirth = "Vnesi kraj rojstva.";
  } else if (data.placeOfBirth.length > 160) {
    fieldErrors.placeOfBirth = "Kraj rojstva naj bo krajši od 160 znakov.";
  }

  if (data.streetAddress.length < 5) {
    fieldErrors.streetAddress = "Vnesi stalno prebivališče.";
  } else if (data.streetAddress.length > 160) {
    fieldErrors.streetAddress =
      "Naslov stalnega prebivališča naj bo krajši od 160 znakov.";
  }

  if (data.cityAndPostalCode.length < 3) {
    fieldErrors.cityAndPostalCode = "Vnesi kraj in poštno številko.";
  } else if (data.cityAndPostalCode.length > 160) {
    fieldErrors.cityAndPostalCode =
      "Kraj in poštna številka naj bosta krajša od 160 znakov.";
  }

  if (!REGIONS.includes(data.residenceRegion as RegionOption)) {
    fieldErrors.residenceRegion = "Izberi regijo prebivališča.";
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

  if (
    !PARTICIPATION_MODES.includes(
      data.participationMode as ParticipationModeOption,
    )
  ) {
    fieldErrors.participationMode = "Izberi obliko sodelovanja.";
  }

  if (data.discordUsername.length > 120) {
    fieldErrors.discordUsername =
      "Uporabniško ime na Discordu naj bo krajše od 120 znakov.";
  }

  if (data.motivation.length > 4000) {
    fieldErrors.motivation = "Motivacija naj bo krajša od 4000 znakov.";
  }

  if (!data.consentsToDataProcessing) {
    fieldErrors.consentsToDataProcessing =
      "Za oddajo moraš potrditi soglasje za obdelavo osebnih podatkov.";
  }

  if (!data.acceptsStatuteAndProgram) {
    fieldErrors.acceptsStatuteAndProgram =
      "Za oddajo moraš potrditi, da sprejemaš statut in program.";
  }

  return {
    data: Object.keys(fieldErrors).length === 0 ? data : null,
    fieldErrors,
  };
}

export function normalizeReturnedFieldErrors(
  value: unknown,
): JoinRequestFieldErrors {
  if (!value || typeof value !== "object") {
    return {};
  }

  const normalized: JoinRequestFieldErrors = {};

  for (const fieldName of JOIN_FIELD_NAMES) {
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

function getBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}
