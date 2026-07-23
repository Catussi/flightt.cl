"use client";

import { useActionState, useState } from "react";
import { submitFulfillmentAction } from "@/app/checkout/fulfillmentActions";
import { ChilexpressAddressFields } from "@/components/checkout/ChilexpressAddressFields";

export function FulfillmentForm({
  orderId,
  productLabel,
}: {
  orderId: string;
  productLabel: string;
}) {
  const [state, formAction, pending] = useActionState(submitFulfillmentAction, {});
  const [mode, setMode] = useState<"SHIPPING" | "PICKUP" | "">("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm text-zinc-400">{productLabel}</p>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-200">¿Cómo lo recibes?</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 has-checked:border-sky-500/60">
          <input
            type="radio"
            name="fulfillmentType"
            value="SHIPPING"
            required
            className="mt-1"
            onChange={() => setMode("SHIPPING")}
          />
          <span>
            <span className="block font-medium text-white">Envío Chilexpress</span>
            <span className="text-xs text-zinc-500">
              Cotizamos el envío según tu comuna antes de pagar.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 has-checked:border-amber-500/60">
          <input
            type="radio"
            name="fulfillmentType"
            value="PICKUP"
            required
            className="mt-1"
            onChange={() => setMode("PICKUP")}
          />
          <span>
            <span className="block font-medium text-white">Retiro en feria</span>
            <span className="text-xs text-zinc-500">Solo jueves o domingo · sin costo</span>
          </span>
        </label>
      </fieldset>

      {mode === "PICKUP" ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-zinc-200">Día de retiro</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm has-checked:border-amber-500">
              <input type="radio" name="pickupDay" value="THURSDAY" className="sr-only" required />
              Jueves
            </label>
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-3 text-sm has-checked:border-amber-500">
              <input type="radio" name="pickupDay" value="SUNDAY" className="sr-only" />
              Domingo
            </label>
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Nombre</span>
          <input
            name="buyerFirstName"
            required
            autoComplete="given-name"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Apellidos</span>
          <input
            name="buyerLastName"
            required
            autoComplete="family-name"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Correo</span>
        <input
          name="buyerEmail"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Teléfono</span>
        <input
          name="buyerPhone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="9XXXXXXXX"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      {mode === "SHIPPING" ? <ChilexpressAddressFields /> : null}

      {state?.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
      >
        {pending ? "Cotizando envío…" : "Continuar al pago"}
      </button>
    </form>
  );
}
