/**
 * Stackra file contract:
 * Purpose: `DevInfraService`, one container of the dev compose as `devComposeOf` planned it: its block name and kind,
 *          whether every lane shares it, whether it starts only on request, its host ports after the lane shift and
 *          its address.
 * Boundary: type only. The address is on 127.0.0.1, where Compose publishes every port.
 * Runtime: isomorphic
 * Governing contract: ADR 0199 (decision 3); ADR 0296 (decision 1); STA-2664 (item 6).
 */

/** One planned dev infra container. */
export type DevInfraService = {
  /** Its key under `environments.dev.infra`, and its Compose service name. */
  readonly name: string;
  /** Its kind (`valkey`, `seaweedfs`, …), or the name itself for a block that spells its own `containerPorts`. */
  readonly kind: string;
  /** Whether one container serves every lane (`perLane: false`), in the shared Compose project. */
  readonly shared: boolean;
  /** Whether it starts only when asked (`when: opt-in`, `stackra dev --infra <name>`). */
  readonly optIn: boolean;
  /** Each port field to its host port. */
  readonly ports: Readonly<Record<string, number>>;
  /** The host port of its address. */
  readonly port: number;
  /** Its address (`redis://127.0.0.1:6379`). */
  readonly url: string;
};
