/**
 * Stackra file contract:
 * Purpose: `buildPkpass`, the signed Apple Wallet bundle of a pass's files: `manifest.json` (the SHA-1 of every file),
 *          `signature` (the `CmsSigner`'s detached signature of the manifest) and the files, zipped.
 * Boundary: pure apart from Web Crypto's SHA-1 and the injected signer. The zip is @stackra/data-transfer's
 *           `writeZip`; the bundle is held in memory (a pass is a few kilobytes). A file named `manifest.json` or
 *           `signature` is refused, so a caller cannot replace either.
 * Runtime: isomorphic
 * Governing contract: ADR 0348 (decision 5); Apple "Building a Pass" (manifest and signature); RFC 5652.
 */
import { writeZip } from "@stackra/data-transfer";

import type { CmsSigner } from "#contracts/ports/cms-signer.port";

/** The hex SHA-1 of `bytes`. */
async function sha1(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", new Uint8Array(bytes)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The `.pkpass` bytes.
 *
 * @param files - the bundle's files by name (`pass.json`, `icon.png`).
 * @param signedAt - the signing time; also the date of every zip entry.
 * @throws TypeError when `files` names `manifest.json` or `signature`.
 * @example
 * const bytes = await buildPkpass({ "pass.json": json, "icon.png": icon }, signer, request.issuedAt);
 */
export async function buildPkpass(
  files: Readonly<Record<string, Uint8Array>>,
  signer: CmsSigner,
  signedAt: Date,
): Promise<Uint8Array> {
  if ("manifest.json" in files || "signature" in files)
    throw new TypeError("a pass bundle's manifest.json and signature are written by buildPkpass");
  const manifest: Record<string, string> = {};
  for (const [name, bytes] of Object.entries(files)) manifest[name] = await sha1(bytes);
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  const signature = await signer.sign(manifestBytes, signedAt);
  const entries = [
    ...Object.entries(files).map(([name, bytes]) => ({ name, bytes: [bytes] })),
    { name: "manifest.json", bytes: [manifestBytes] },
    { name: "signature", bytes: [signature] },
  ];
  const chunks: Uint8Array[] = [];
  for await (const chunk of writeZip(entries, signedAt)) chunks.push(chunk);
  const out = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
