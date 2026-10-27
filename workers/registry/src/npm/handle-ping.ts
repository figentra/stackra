/**
 * Stackra file contract:
 * Purpose: `handlePing`: `GET /-/ping`.
 * Boundary: reads only; never proxies an upstream (an unknown name is 404).
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 4, 5, 9, 10 and 13).
 */
import { json } from "#src/http/json";

/** `GET /-/ping`. */
export const handlePing = (): Response => json({});
