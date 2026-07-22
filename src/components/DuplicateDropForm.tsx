"use client";

import type { FormHTMLAttributes } from "react";
import { duplicateDropAction } from "@/app/actions";

export function DuplicateDropForm({ id }: { id: string }) {
  const submit: FormHTMLAttributes<HTMLFormElement>["onSubmit"] = (e) => {
    if (
      !window.confirm(
        "¿Duplicar este drop? Se crea un borrador con los mismos textos (sin prendas).",
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <form action={duplicateDropAction} onSubmit={submit} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:border-amber-500/50 hover:text-amber-200"
      >
        Duplicar
      </button>
    </form>
  );
}
