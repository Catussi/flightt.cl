"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { deleteDropAction } from "@/app/actions";

type Props = {
  id: string;
  label?: ReactNode;
};

export function DeleteDropForm({ id, label = "Eliminar" }: Props) {
  const submit: FormHTMLAttributes<HTMLFormElement>["onSubmit"] = (e) => {
    if (
      !window.confirm(
        "¿Eliminar este drop? Las prendas seguirán en el inventario pero sin drop asignado.",
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <form action={deleteDropAction} onSubmit={submit} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-900/80 px-3 py-1.5 text-xs text-red-400 hover:border-red-700 hover:text-red-300"
      >
        {label}
      </button>
    </form>
  );
}
