"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CheckoutPendientePoller({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => router.refresh();
    const id = window.setInterval(tick, 5000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <p className="mt-4 text-xs text-zinc-500">
      Actualizando estado cada 5 s… (orden {orderId.slice(0, 8)}…)
    </p>
  );
}
