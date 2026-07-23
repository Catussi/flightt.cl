-- Chilexpress: desglose prenda + envío en órdenes
ALTER TABLE "Order" ADD COLUMN "productAmountClp" INTEGER;
ALTER TABLE "Order" ADD COLUMN "shippingCostClp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "buyerCountyCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingServiceName" TEXT;

UPDATE "Order" SET "productAmountClp" = "amountClp" WHERE "productAmountClp" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "productAmountClp" SET NOT NULL;
