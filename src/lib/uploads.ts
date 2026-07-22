import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

function contentType(ext: string): string {
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/gif";
}

/** Saves a product image to Blob storage or local public/uploads. */
export async function saveProductImage(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  const safe = ext && ALLOWED_EXT.includes(ext) ? ext : "jpg";
  const name = `${randomUUID()}.${safe}`;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    const blob = await put(`products/${name}`, buf, {
      access: "public",
      token: blobToken,
      contentType: contentType(safe),
    });
    return blob.url;
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), buf);
  return `/uploads/${name}`;
}
