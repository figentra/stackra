/**
 * Stackra file contract:
 * Purpose: `sendScaleCommand`, which opens the configured link when it is closed and writes one command with the
 *          protocol's terminator, or only opens the link when the command is empty (a scale that streams by itself).
 * Boundary: internal; not exported from the entry. Fire and forget: used where the port's signature is synchronous
 *           (`onWeight`), so a refused link or a failed write is dropped here and shows as no reading; `probe` and
 *           `read` report the refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0250 (decision 3).
 */
import type { SystemPermissions } from "@stackra/platform/contracts";

import type { NativeScaleConfig } from "#config/native-scale.config";
import { connectScale } from "#core/functions/connect-scale.function";

/**
 * Resolves when the command is written or dropped.
 *
 * @example
 * void sendScaleCommand(this.config, this.permissions, "SIR", "\r\n");
 */
export async function sendScaleCommand(
  config: NativeScaleConfig,
  permissions: SystemPermissions,
  command: string,
  terminator: string,
): Promise<void> {
  const linked = await connectScale(config, permissions);
  if (!linked.ok || command === "") return;
  await linked.data.write(command + terminator).catch(() => undefined);
}
