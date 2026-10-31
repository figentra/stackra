/**
 * Stackra file contract:
 * Purpose: `TestbedSettings`, where and as whom `stackra testbed` reaches the boxes: AWS profile and region, SSH key and user.
 * Boundary: type only; `resolveTestbedSettings` builds it.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */

/** The connection settings of one `stackra testbed` run. */
export type TestbedSettings = {
  /** The AWS CLI profile. */
  readonly profile: string;

  /** The AWS region of the pool. */
  readonly region: string;

  /** The SSH private key file; a path, never its content. */
  readonly key: string;

  /** The SSH user on the box. */
  readonly user: string;
};
