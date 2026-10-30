/**
 * Stackra file contract:
 * Purpose: `TestbedInputs`, the whole set of Image Builder inputs with the version derived from its hash.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0484 (decision 2).
 */

import type { TestbedComponentSource } from "#node/types/testbed-component-source.type";
import type { TestbedInputFile } from "#node/types/testbed-input-file.type";

export type TestbedInputs = {
  readonly files: readonly TestbedInputFile[];
  readonly components: readonly TestbedComponentSource[];
  /** Image Builder component and recipe version, `1.<n>.0`, derived from the hash of every input. */
  readonly version: string;
};
