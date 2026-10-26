/**
 * Stackra file contract:
 * Purpose: `denyPermission`, the per-test deny helper of the "memory" `AccessControl`: the last compiled testing app
 *          refuses calls that need `permission` with `ForbiddenError`, until the returned function restores it.
 * Boundary: test only. Acts on the app `run(...)` uses (the last compile), and only when that app took the memory
 *           driver; an app with the real iam driver or an override is refused with an error naming the fix, so a test
 *           never believes it denied something it did not.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0138 (as amended: permission step).
 */
import { AccessControl } from "#contracts/index";
import { CURRENT_PIPELINE } from "#testing/constants/current-pipeline.constant";
import { MemoryAccessControlDriver } from "#testing/drivers/memory-access-control.driver";

/**
 * Denies `permission` on the last compiled testing app.
 *
 * @returns a function that allows `permission` again (for an app shared by several tests).
 * @throws Error when no testing app compiled, or its `AccessControl` is not the memory driver.
 * @example
 * denyPermission("catalogue.product.update");
 * expect(await run(UpdateProductAction, input, { as })).toMatchObject({ ok: false, error: { kind: "forbidden" } });
 */
export function denyPermission(permission: string): () => void {
  const app = CURRENT_PIPELINE.value?.app;
  const access = app?.has(AccessControl) === true ? app.get(AccessControl) : undefined;
  if (!(access instanceof MemoryAccessControlDriver))
    throw new Error(
      'denyPermission needs a testing app on the memory AccessControl: compile with .useDrivers("memory") first',
    );
  access.deny(permission);
  return () => access.allow(permission);
}
