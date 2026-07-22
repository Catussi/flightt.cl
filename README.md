# Flightt — Catálogo y checkout

Tienda online de ropa con inventario por piezas únicas, drops de feria y venta directa desde el catálogo.

## Stack

- Next.js 16 (App Router)
- React 19, TypeScript, Tailwind CSS 4
- PostgreSQL + Prisma
- Mercado Pago Payment Brick
- Resend (correo), Vercel Blob (imágenes)

## Funcionalidades

- Catálogo público por categorías (arriba, abajo, accesorios) y sección de ofertas
- Drops publicables con hero destacado
- Checkout con Mercado Pago y formulario post-pago (envío Starken o retiro en feria)
- Panel admin: productos, drops, pedidos e inventario
- Cuenta de cliente con programa de fidelidad (5 compras → 20% en la siguiente)
- Recordatorios automáticos de retiro vía cron
- Consultas por WhatsApp e Instagram

## Requisitos

- Node.js 20+
- Base PostgreSQL

## Configuración

Copia las variables de entorno:

```bash
cp .env.example .env
```

Completa al menos `DATABASE_URL`, `ADMIN_PASSWORD` y `SESSION_SECRET`. El resto de variables está documentado en `.env.example`.

Aplica migraciones y arranca en desarrollo:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

La app queda en [http://localhost:3000](http://localhost:3000). El panel admin está en `/admin`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (incluye Prisma) |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

## Estructura

```
src/app/          Rutas públicas, admin, checkout y API
src/components/   UI compartida
src/lib/          Dominio: pagos, fidelidad, notificaciones, uploads
prisma/           Schema y migraciones
```

## Licencia

Proyecto privado. Todos los derechos reservados.
