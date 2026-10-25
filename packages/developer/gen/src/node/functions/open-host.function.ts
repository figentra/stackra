/**
 * Stackra file contract:
 * Purpose: `openHost`, how a gen run opens a member's program: the TypeScript 7 host by default, the TypeScript 6
 *          host when asked for or when tsgo cannot start.
 * Boundary: chooses a backend and nothing else; both answer the same questions with the same results.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26: the TypeScript 7 API with a TypeScript 6 fallback).
 */
import { openTs6Host } from "#node/functions/open-ts6-host.function";
import { openTsgoHost } from "#node/functions/open-tsgo-host.function";
import type { TsHost } from "#node/types/ts-host.type";

/**
 * The host for `tsconfig`.
 *
 * @param tsconfig - the member's tsconfig.json.
 * @param backend - `tsgo` (the default, falling back to TypeScript 6 on failure) or `ts6`.
 * @example
 * const host = await openHost("tsconfig.json");
 * try { host.files(); } finally { host.close(); }
 */
export async function openHost(
  tsconfig: string,
  backend: "tsgo" | "ts6" = "tsgo",
): Promise<TsHost> {
  if (backend === "ts6") return openTs6Host(tsconfig);
  try {
    return await openTsgoHost(tsconfig);
  } catch {
    // tsgo needs its platform binary; the in-process TypeScript 6 API answers the same questions.
    return openTs6Host(tsconfig);
  }
}
