import { MP_CHILE_TEST_HINT } from "@/lib/payments/mpErrors";

export function MpChileTestHint() {
  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 px-4 py-3 text-left text-xs text-amber-100/90">
      <p className="font-semibold text-amber-200">Modo prueba Mercado Pago (Chile)</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-amber-100/80">
        <li>
          Tarjeta Mastercard:{" "}
          <span className="font-mono text-amber-50">{MP_CHILE_TEST_HINT.card}</span>
        </li>
        <li>
          CVV <span className="font-mono">{MP_CHILE_TEST_HINT.cvv}</span> · Vence{" "}
          <span className="font-mono">{MP_CHILE_TEST_HINT.expiry}</span>
        </li>
        <li>
          Nombre del titular: <span className="font-mono">{MP_CHILE_TEST_HINT.holder}</span>
        </li>
        <li>
          Documento: <span className="font-mono">{MP_CHILE_TEST_HINT.document}</span>
        </li>
      </ul>
    </div>
  );
}
