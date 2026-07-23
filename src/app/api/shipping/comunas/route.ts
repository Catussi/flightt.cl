import { NextResponse } from "next/server";
import { fetchCoverageCounties } from "@/lib/chilexpress/client";
import { isChilexpressConfigured } from "@/lib/chilexpress/config";

export async function GET() {
  if (!isChilexpressConfigured()) {
    return NextResponse.json({ error: "Chilexpress no configurado" }, { status: 503 });
  }

  try {
    const counties = await fetchCoverageCounties();
    const regions = [...new Map(
      counties.map((c) => [
        c.regionName || c.regionCode || "Chile",
        { code: c.regionCode, name: c.regionName || c.regionCode },
      ]),
    ).values()].sort((a, b) => a.name.localeCompare(b.name, "es"));

    return NextResponse.json({ regions, counties });
  } catch (e) {
    console.error("[chilexpress] coverage", e);
    return NextResponse.json(
      { error: "No se pudieron cargar comunas Chilexpress" },
      { status: 502 },
    );
  }
}
