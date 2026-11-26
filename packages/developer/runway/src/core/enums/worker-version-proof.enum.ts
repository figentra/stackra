/**
 * Stackra file contract:
 * Purpose: `WorkerVersionProof`, how a `targets.cloudflare-workers` member proves which Worker version answered its
 *          smoke: every answer names it in the `x-stackra-version` header (a Worker with a script on every path), or
 *          its `/-/version` route does, read before and after the smoke checks (a Worker whose answers are static
 *          assets: docs, static).
 * Boundary: an `Enum.of` value plus the type of the same name. The names are `WORKER_VERSION`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0536 (gate 2); ADR 0231 (kebab-case codes), ADR 0128 (`Enum.of`); STA-2786.
 */
import { Enum } from "@stackra/contracts";

/** One case per way a Worker names the version that answered. */
export const WorkerVersionProof = Enum.of({
  /** Every answer carries the `x-stackra-version` header. */
  Header: "header",
  /** `GET /-/version` answers the id in its body and its header. */
  Route: "route",
});

/** One of the codes above. */
export type WorkerVersionProof = Enum.Value<typeof WorkerVersionProof>;
