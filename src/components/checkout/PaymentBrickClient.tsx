"use client";

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps } from "react";

type PaymentBrickSubmitData = Parameters<
  NonNullable<ComponentProps<typeof Payment>["onSubmit"]>
>[0];

export function PaymentBrickClient({
  publicKey,
  orderId,
  amount,
  productLabel,
}: {
  publicKey: string;
  orderId: string;
  amount: number;
  productLabel: string;
}) {
  const router = useRouter();
  const initedRef = useRef(false);
  const [brickError, setBrickError] = useState<string | null>(null);

  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;
    initMercadoPago(publicKey, { locale: "es-CL" });
  }, [publicKey]);

  async function onSubmit(data: PaymentBrickSubmitData) {
    setBrickError(null);
    const r = await fetch("/api/payments/brick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, brickPayload: data }),
    });
    const j = (await r.json()) as { redirect?: string; error?: string };
    if (!r.ok) {
      throw new Error(j.error ?? "No se pudo procesar el pago");
    }
    if (!j.redirect) {
      throw new Error("Respuesta inválida del servidor");
    }
    router.push(j.redirect);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">{productLabel}</p>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <Payment
          initialization={{ amount }}
          customization={
            {
              paymentMethods: {
                maxInstallments: 12,
                creditCard: "all",
                debitCard: "all",
                ticket: "all",
                bankTransfer: "all",
              },
            } as ComponentProps<typeof Payment>["customization"]
          }
          locale="es-CL"
          onSubmit={onSubmit}
          onError={() => setBrickError("Error al cargar el formulario de pago.")}
        />
      </div>
      {brickError ? (
        <p className="text-center text-sm text-red-400" role="alert">
          {brickError}
        </p>
      ) : null}
    </div>
  );
}
