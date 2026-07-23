"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PayButton({
  productId,
  label = "Pagar ahora",
}: {
  productId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPay() {
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const j = (await r.json()) as { orderId?: string; error?: string };
      if (!r.ok) {
        const msg =
          r.status === 503
            ? "Pagos en línea no disponibles por ahora. Consulta por WhatsApp."
            : r.status === 409
              ? "Esta prenda ya no está disponible."
              : (j.error ?? "No se pudo iniciar el pago");
        throw new Error(msg);
      }
      if (!j.orderId) throw new Error("Sin orden de pago");
      router.push(`/checkout/datos/${j.orderId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={loading}
        onClick={onPay}
        className="flex w-full items-center justify-center rounded-xl bg-sky-500 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-sky-900/30 hover:bg-sky-400 disabled:opacity-60 sm:py-3 sm:text-base"
      >
        {loading ? "Reservando…" : label}
      </button>
      {err ? (
        <p className="mt-2 text-center text-xs text-red-400" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
