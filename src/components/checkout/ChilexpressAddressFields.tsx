"use client";

import { useEffect, useMemo, useState } from "react";

type County = {
  countyCode: string;
  countyName: string;
  regionCode: string;
  regionName: string;
};

export function ChilexpressAddressFields() {
  const [counties, setCounties] = useState<County[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [regionKey, setRegionKey] = useState("");
  const [countyCode, setCountyCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/shipping/comunas");
        const j = (await r.json()) as { counties?: County[]; error?: string };
        if (!r.ok) throw new Error(j.error ?? "Error al cargar comunas");
        if (!cancelled) setCounties(j.counties ?? []);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "No se pudieron cargar comunas",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of counties) {
      const key = c.regionName || c.regionCode;
      if (key) map.set(key, key);
    }
    return [...map.values()].sort((a, b) => a.localeCompare(b, "es"));
  }, [counties]);

  const comunasInRegion = useMemo(() => {
    if (!regionKey) return [];
    return counties.filter((c) => (c.regionName || c.regionCode) === regionKey);
  }, [counties, regionKey]);

  const selected = counties.find((c) => c.countyCode === countyCode);

  return (
    <>
      <input type="hidden" name="buyerCountyCode" value={countyCode} />
      <input type="hidden" name="buyerRegion" value={selected?.regionName ?? regionKey} />
      <input type="hidden" name="buyerCommune" value={selected?.countyName ?? ""} />

      {loadError ? (
        <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
          {loadError}. Revisa la API key de Chilexpress en el servidor.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Región</span>
          <select
            required
            value={regionKey}
            onChange={(e) => {
              setRegionKey(e.target.value);
              setCountyCode("");
            }}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
          >
            <option value="">Elige región</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Comuna</span>
          <select
            required
            value={countyCode}
            disabled={!regionKey || comunasInRegion.length === 0}
            onChange={(e) => setCountyCode(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2 disabled:opacity-50"
          >
            <option value="">Elige comuna</option>
            {comunasInRegion.map((c) => (
              <option key={c.countyCode} value={c.countyCode}>
                {c.countyName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Dirección</span>
        <input
          name="buyerAddress"
          required
          autoComplete="street-address"
          placeholder="Calle y número"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <p className="text-xs text-zinc-500">
        El costo de envío Chilexpress se calcula al continuar, según comuna y prenda.
      </p>
    </>
  );
}
