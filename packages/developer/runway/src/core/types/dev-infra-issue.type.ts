/**
 * Stackra file contract:
 * Purpose: `DevInfraIssue`, one refusal `devComposeOf` reports for the root runway's `environments.dev.infra`: a
 *          snake_case code, the infra block it is about and a message that names the fix.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case codes); STA-2664 (item 6).
 */

/** One dev infra refusal. */
export type DevInfraIssue = {
  /**
   * `infra_kind_unknown` (no known kind and no `containerPorts`), `infra_image_missing`, `infra_port_missing` (a port
   * the kind listens on is not written), `infra_port_invalid` (not a port, or a lane pushes it past 65535),
   * `infra_when_invalid`, `infra_bucket_invalid`, `infra_env_conflict` (two services give one variable) or
   * `infra_opt_in_unknown` (an opt-in name no block declares with `when: opt-in`).
   */
  readonly code:
    | "infra_kind_unknown"
    | "infra_image_missing"
    | "infra_port_missing"
    | "infra_port_invalid"
    | "infra_when_invalid"
    | "infra_bucket_invalid"
    | "infra_env_conflict"
    | "infra_opt_in_unknown";
  /** The infra block it is about (its key under `environments.dev.infra`). */
  readonly service: string;
  /** What is wrong and how to fix it. */
  readonly message: string;
};
