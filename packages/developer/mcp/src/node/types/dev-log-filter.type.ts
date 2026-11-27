/**
 * Stackra file contract:
 * Purpose: `DevLogFilter`, what the `logs`, `last_error` and `browser_logs` tools narrow the dev log to: the source,
 *          the lowest level kept, the member folder, the browser report kind, a start time and a text.
 * Boundary: type only; `devLogQuery` applies it. An absent field keeps everything.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */
import type { DevLogEntry } from "@stackra/runway";

/** What a tool narrows the dev log to. */
export type DevLogFilter = {
  /** Only `server` lines or only `browser` reports. */
  readonly source?: DevLogEntry["source"] | undefined;
  /** The lowest level kept. */
  readonly level?: DevLogEntry["level"] | undefined;
  /** The member folder from the root (`apps/console`). */
  readonly member?: string | undefined;
  /** A browser report kind. */
  readonly kind?: DevLogEntry["kind"] | undefined;
  /** Only entries at or after this time. */
  readonly since?: Date | undefined;
  /** Text the message or stack holds, any case. */
  readonly search?: string | undefined;
};
