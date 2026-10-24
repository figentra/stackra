/**
 * Stackra file contract:
 * Purpose: `UpdateStrategy`, how a new PWA service worker reaches open tabs (`PwaConfig.updates.strategy`).
 * Boundary: an `Enum.of` value plus the type of the same name; gen compiles it into the generated `sw.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0255; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** How a new worker takes over. */
export const UpdateStrategy = Enum.of({
  /** Waits; the app offers the update and the worker activates when the user accepts. */
  Prompt: "prompt",
  /** Activates at once and claims the open tabs. */
  Auto: "auto",
});

/** One of the codes above. */
export type UpdateStrategy = Enum.Value<typeof UpdateStrategy>;
