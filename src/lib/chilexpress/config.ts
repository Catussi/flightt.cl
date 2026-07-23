export type ChilexpressEnv = "sandbox" | "production";

export function chilexpressSubscriptionKey(): string | null {
  const key = process.env.CHILEXPRESS_SUBSCRIPTION_KEY?.trim();
  return key || null;
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

export function isChilexpressConfigured(): boolean {
  return chilexpressSubscriptionKey() != null;
}

/** Peso/dimensiones por defecto para ropa (sobre estándar). */
export const DEFAULT_PACKAGE = {
  weightKg: 0.5,
  heightCm: 10,
  widthCm: 30,
  lengthCm: 40,
} as const;
