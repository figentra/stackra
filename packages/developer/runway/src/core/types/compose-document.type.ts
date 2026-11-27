/**
 * Stackra file contract:
 * Purpose: `ComposeDocument`, the Compose file `devComposeOf` writes: the project name, the services
 *          (`ComposeService`) and the named volumes.
 * Boundary: type only; the keys are Compose's own spelling, so the document serialises to YAML as it is.
 * Runtime: isomorphic
 * Governing contract: the Compose specification (compose-spec.io); ADR 0199 (decision 3); STA-2664 (item 6).
 */
import type { ComposeService } from "#core/types/compose-service.type";

/** One Compose file. */
export type ComposeDocument = {
  /** The Compose project name, so `docker compose -f <file>` needs no `-p`. */
  readonly name: string;
  /** The services, by their infra block name. */
  readonly services: Readonly<Record<string, ComposeService>>;
  /** The named volumes the services keep their data in. */
  readonly volumes?: Readonly<Record<string, Readonly<Record<string, never>>>>;
};
