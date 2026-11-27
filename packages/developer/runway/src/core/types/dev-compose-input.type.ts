/**
 * Stackra file contract:
 * Purpose: `DevComposeInput`, what `devComposeOf` plans from: the product key that names the Compose projects, the
 *          root runway's `environments.dev.infra` and `lanes` blocks, the lane, and the opt-in services asked for.
 * Boundary: type only; the blocks are the parsed runway's, still open objects.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1); STA-2664 (item 6).
 */

/** The input of one dev compose plan. */
export type DevComposeInput = {
  /** The product key (`root.product.key`, else `root.project`); the Compose projects are named after it. */
  readonly project: string;
  /** `environments.dev.infra` of the root runway. */
  readonly infra: Readonly<Record<string, Readonly<Record<string, unknown>>>> | undefined;
  /** `environments.dev.lanes` of the root runway. */
  readonly lanes?:
    | { readonly enabled?: boolean | undefined; readonly portStep?: number | undefined }
    | undefined;
  /** The dev lane (`STACKRA_LANE`); every per-lane port moves by lane × `portStep`. */
  readonly lane: number;
  /** The `when: opt-in` blocks to start too (`stackra dev --infra <name>`). */
  readonly optIn?: readonly string[];
};
