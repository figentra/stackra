/**
 * Stackra file contract:
 * Purpose: `DevInfraHealthcheck`, the health check of one dev infra container in Compose's terms, which
 *          `docker compose up --wait` waits on before `stackra dev` starts the member.
 * Boundary: type only. Durations are Compose durations (`2s`, `10m`).
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3); STA-2664 (item 6).
 */

/** The health check of a container. */
export type DevInfraHealthcheck = {
  /** The check, as Compose's `test` (`CMD` or `CMD-SHELL` first). */
  readonly test: readonly string[];
  /** How often it runs. */
  readonly interval: string;
  /** How long one run may take. */
  readonly timeout: string;
  /** Failed runs after `startPeriod` before the container is unhealthy. */
  readonly retries: number;
  /** How long failures do not count after the container starts (ClamAV loads its signatures first). */
  readonly startPeriod: string;
};
