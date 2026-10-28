/**
 * Stackra file contract:
 * Purpose: `previewSeedStep(database, product)`, the command that fills a fresh preview database once the deploy has
 *          migrated it: `stackra seed-pack <product> --profile <profile> --env preview`; `null` for a branch, which
 *          already holds its parent's rows.
 * Boundary: pure; plans the command and runs nothing (the preview deploy job runs it with its `CommandRunner`).
 * Runtime: isomorphic
 * Governing contract: ADR 0190 (seed-pack profiles), ADR 0352 (decision 3: a plan is data).
 */
import { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { PreviewDatabase } from "#core/types/preview-database.type";

/** A product key, as `stackra seed-pack` takes it. */
const PRODUCT = /^[a-z][a-z0-9-]*$/;

/**
 * The seed command of a preview database.
 *
 * @throws TypeError when `product` is not a product key.
 * @example
 * previewSeedStep({ from: "seed-pack", profile: "demo" }, "commerce");
 * // { command: "stackra", args: ["seed-pack", "commerce", "--profile", "demo", "--env", "preview"] }
 */
export function previewSeedStep(database: PreviewDatabase, product: string): DeployStep | null {
  if (!PRODUCT.test(product)) throw new TypeError(`${product} is not a product key`);
  if (database.from !== "seed-pack") return null;
  return {
    command: "stackra",
    args: ["seed-pack", product, "--profile", database.profile, "--env", RunwayEnvironment.Preview],
  };
}
