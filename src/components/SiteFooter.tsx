import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { footerLines, storeName } from "@/lib/site";

export function SiteFooter() {
  const lines = footerLines();
  const name = storeName();
  const mp = isPaymentBrickConfigured();

  return (
    <footer className="mt-12 border-t border-zinc-800/80 bg-zinc-950 py-10 text-zinc-400">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-sm font-medium text-zinc-300">{name}</p>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
          {mp ? (
            <li>Pagos con tarjeta o medios disponibles vía Mercado Pago.</li>
          ) : null}
        </ul>
        <p className="mt-6 text-[10px] text-zinc-600">
          Catálogo con disponibilidad en tiempo real. Pregunta siempre por el código de la
          prenda.
        </p>
      </div>
    </footer>
  );
}