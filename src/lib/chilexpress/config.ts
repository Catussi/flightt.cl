export type ChilexpressEnv = "sandbox" | "production";

function pickKey(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/** Key de la suscripción Coberturas (flightt-cl-cobertura). */
export function chilexpressCoverageKey(): string | null {
  return pickKey(
    process.env.CHILEXPRESS_COVERAGE_KEY,
    process.env.CHILEXPRESS_SUBSCRIPTION_KEY,
  );
}

/** Key de la suscripción Cotizador (flightt-cl-cotizador). */
export function chilexpressRatingKey(): string | null {
  return pickKey(
    process.env.CHILEXPRESS_RATING_KEY,
    process.env.CHILEXPRESS_SUBSCRIPTION_KEY,
  );
}

/** @deprecated Usa chilexpressCoverageKey / chilexpressRatingKey. */
export function chilexpressSubscriptionKey(): string | null {
  return chilexpressCoverageKey();
}

export function chilexpressEnv(): ChilexpressEnv {
  return process.env.CHILEXPRESS_ENV === "production" ? "production" : "sandbox";
}

export function chilexpressBaseUrl(): string {
  return chilexpressEnv() === "production"
    ? "https://services.wschilexpress.com"
    : "https://testservices.wschilexpress.com";
}

/** Código de cobertura Chilexpress (4 letras) desde donde despachas. Ej. STGO, PROV, NUNO. */
export function chilexpressOriginCountyCode(): string {
  return (
    process.env.CHILEXPRESS_ORIGIN_COUNTY_CODE?.trim().toUpperCase() || "STGO"
  );
}

export function isChilexpressCoverageConfigured(): boolean {
  return chilexpressCoverageKey() != null;
}

export function isChilexpressRatingConfigured(): boolean {
  return chilexpressRatingKey() != null;
}

export function isChilexpressConfigured(): boolean {
  return isChilexpressCoverageConfigured() && isChilexpressRatingConfigured();
}

/** Peso/dimensiones por defecto para ropa (sobre estándar). */
export const DEFAULT_PACKAGE = {
  weightKg: 0.5,
  heightCm: 10,
  widthCm: 30,
  lengthCm: 40,
} as const;
