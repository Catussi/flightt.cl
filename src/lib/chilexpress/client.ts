import {
  chilexpressBaseUrl,
  chilexpressCoverageKey,
  chilexpressOriginCountyCode,
  chilexpressRatingKey,
  DEFAULT_PACKAGE,
} from "@/lib/chilexpress/config";

type CoverageCounty = {
  countyCode: string;
  countyName: string;
  regionCode: string;
  regionName: string;
};

type QuoteResult = {
  costClp: number;
  serviceName: string;
  serviceCode: number;
};

let coverageCache: CoverageCounty[] | null = null;
let coverageCacheAt = 0;
const COVERAGE_TTL_MS = 1000 * 60 * 60 * 24;

function coverageHeaders(): HeadersInit {
  const key = chilexpressCoverageKey();
  if (!key) throw new Error("Chilexpress Coberturas no configurado");
  return {
    Accept: "application/json",
    "Ocp-Apim-Subscription-Key": key,
    "Cache-Control": "no-cache",
  };
}

function ratingHeaders(): HeadersInit {
  const key = chilexpressRatingKey();
  if (!key) throw new Error("Chilexpress Cotizador no configurado");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Ocp-Apim-Subscription-Key": key,
    "Cache-Control": "no-cache",
  };
}

function pickCounties(payload: unknown): CoverageCounty[] {
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;
  const list = Array.isArray((root as Record<string, unknown>).coverageAreas)
    ? ((root as Record<string, unknown>).coverageAreas as unknown[])
    : Array.isArray((data as Record<string, unknown>)?.coverageAreas)
      ? ((data as Record<string, unknown>).coverageAreas as unknown[])
      : Array.isArray(data)
        ? (data as unknown[])
        : [];

  return list
    .map((row) => {
      const r = row as Record<string, unknown>;
      const countyCode = String(
        r.countyCode ?? r.CountyCode ?? r.coverageAreaCode ?? r.code ?? "",
      ).trim();
      const countyName = String(
        r.countyName ?? r.CountyName ?? r.coverageAreaName ?? r.coverageName ?? r.name ?? "",
      ).trim();
      const regionCode = String(r.regionCode ?? r.RegionCode ?? r.regionId ?? "").trim();
      const regionName = String(
        r.regionName ?? r.RegionName ?? r.regionDescription ?? "",
      ).trim();
      if (!countyCode || !countyName) return null;
      return { countyCode, countyName, regionCode, regionName };
    })
    .filter((x): x is CoverageCounty => x != null);
}

async function fetchRegionNames(): Promise<Map<string, string>> {
  const url = `${chilexpressBaseUrl()}/georeference/api/v1.0/regions`;
  const res = await fetch(url, { headers: coverageHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) return new Map();

  const json = (await res.json()) as { regions?: Array<Record<string, unknown>> };
  const map = new Map<string, string>();
  for (const region of json.regions ?? []) {
    const id = String(region.regionId ?? region.RegionId ?? "").trim();
    const name = String(region.regionName ?? region.RegionName ?? "").trim();
    if (id && name) map.set(id, name);
  }
  return map;
}

export async function fetchCoverageCounties(): Promise<CoverageCounty[]> {
  const now = Date.now();
  if (coverageCache && now - coverageCacheAt < COVERAGE_TTL_MS) {
    return coverageCache;
  }

  const url = `${chilexpressBaseUrl()}/georeference/api/v1.0/coverage-areas?RegionCode=99&type=0`;
  const res = await fetch(url, { headers: coverageHeaders(), next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`Cobertura Chilexpress respondió ${res.status}`);
  }

  const json = (await res.json()) as unknown;
  const counties = pickCounties(json);
  if (counties.length === 0) {
    throw new Error("Chilexpress no devolvió comunas");
  }

  const regionNames = await fetchRegionNames();
  coverageCache = counties
    .map((county) => ({
      ...county,
      regionName: county.regionName || regionNames.get(county.regionCode) || county.regionCode,
    }))
    .sort(
      (a, b) =>
        a.regionName.localeCompare(b.regionName, "es") ||
        a.countyName.localeCompare(b.countyName, "es"),
    );
  coverageCacheAt = now;
  return coverageCache;
}

export async function findCountyByCode(code: string): Promise<CoverageCounty | null> {
  const counties = await fetchCoverageCounties();
  const normalized = code.trim().toUpperCase();
  return counties.find((c) => c.countyCode.toUpperCase() === normalized) ?? null;
}

function pickCheapestQuote(payload: unknown): QuoteResult | null {
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const options = (
    data.courierServiceOptions ??
    data.CourierServiceOptions ??
    data.services ??
    []
  ) as unknown[];

  if (!Array.isArray(options) || options.length === 0) return null;

  let best: QuoteResult | null = null;
  for (const opt of options) {
    const o = opt as Record<string, unknown>;
    const rawValue =
      o.serviceValue ?? o.ServiceValue ?? o.serviceCost ?? o.price ?? o.total;
    const costClp = Math.round(Number(rawValue));
    if (!Number.isFinite(costClp) || costClp <= 0) continue;

    const serviceCode = Number(o.serviceCode ?? o.ServiceCode ?? 0);
    const serviceName = String(
      o.serviceDescription ?? o.ServiceDescription ?? o.serviceName ?? "Chilexpress",
    );

    if (!best || costClp < best.costClp) {
      best = { costClp, serviceName, serviceCode };
    }
  }

  return best;
}

export async function quoteChilexpressShipping(input: {
  destinationCountyCode: string;
  declaredWorthClp: number;
  weightKg?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
}): Promise<QuoteResult> {
  const url = `${chilexpressBaseUrl()}/rating/api/v1.0/rates/courier`;
  const pkg = {
    weight: Number((input.weightKg ?? DEFAULT_PACKAGE.weightKg).toFixed(2)),
    height: input.heightCm ?? DEFAULT_PACKAGE.heightCm,
    width: input.widthCm ?? DEFAULT_PACKAGE.widthCm,
    length: input.lengthCm ?? DEFAULT_PACKAGE.lengthCm,
  };

  const body = {
    originCountyCode: chilexpressOriginCountyCode(),
    destinationCountyCode: input.destinationCountyCode.trim().toUpperCase(),
    package: pkg,
    productType: 3,
    contentType: 1,
    declaredWorth: Math.max(1, Math.round(input.declaredWorthClp)),
    deliveryTime: 0,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: ratingHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json &&
      "statusDescription" in json &&
      (json as { statusDescription?: string }).statusDescription
        ? String((json as { statusDescription: string }).statusDescription)
        : res.status === 401
          ? "Key del Cotizador inválida. Usa la Primary key de flightt-cl-cotizador."
          : `Cotización falló (${res.status})`;
    throw new Error(msg);
  }

  const quote = pickCheapestQuote(json);
  if (!quote) {
    throw new Error("Chilexpress no tiene servicio para esa comuna.");
  }

  return quote;
}
