import type { Prisma } from "@prisma/client";

/** Orden del catálogo: mayor prioridad primero, luego más recientes. */
export const productListOrderBy: Prisma.ProductOrderByWithRelationInput[] = [
  { sortOrder: "desc" },
  { createdAt: "desc" },
];
