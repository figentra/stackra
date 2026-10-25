/**
 * Stackra file contract:
 * Purpose: `DeviceAcknowledgedQuery`, `devices.device.acknowledged@1` (`GET /devices/acknowledged`): a device's last
 *          acknowledged sequence, the highest one the action pipeline applied or rejected. The calling device reads
 *          its own as proof of a sync; the shop reads a lost or revoked device's, so its unsent loss is known.
 * Boundary: read only, over `@stackra/actions`' `DeviceSequenceStore`. With no input it answers for `ctx.deviceId`,
 *           the device the transport verified from `DEVICE_ORDER.deviceHeader`; a call from no verified device is
 *           refused `input_invalid`. Another device's sequence is answered only when its last settled call acted
 *           within the caller's scope (any scope for a platform caller), else `null`, so a caller learns nothing about
 *           a device outside its scope. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0235 (devices are principals); ADR 0327 (decision 6: the
 *                     call's scope); ADR 0294 (decisions 16, 20 and 21).
 */
import { InputInvalidError, Query, type QueryContext } from "@stackra/actions";
import type { DeviceSequenceStore } from "@stackra/actions/contracts";
import { ActorKind, type ScopeRef } from "@stackra/contracts";

import type { DeviceAcknowledgedInput } from "#node/schemas/device-acknowledged-input.schema";
import { DeviceAcknowledgedOutput } from "#node/schemas/device-acknowledged-output.schema";

/** Whether a call that acted in `scope` lies within the caller's scope (ltree `<@` on the paths). */
function isVisible(scope: ScopeRef | undefined, caller: ScopeRef | undefined): boolean {
  if (caller === undefined) return true;
  return (
    scope !== undefined && (scope.path === caller.path || scope.path.startsWith(`${caller.path}.`))
  );
}

/**
 * Answers a device's last acknowledged sequence.
 *
 * @example
 * const { sequence } = await pipeline.execute(DeviceAcknowledgedQuery, {}, { actor, device: { deviceId } });
 */
export class DeviceAcknowledgedQuery extends Query({
  key: "device.acknowledged",
  actors: [ActorKind.User],
  tool: false,
}) {
  /** Each device's last settled call. */
  private readonly sequences: DeviceSequenceStore;

  /** @param sequences - the pipeline's device sequence store. */
  constructor(sequences: DeviceSequenceStore) {
    super();
    this.sequences = sequences;
  }

  /**
   * The calling device's last acknowledged sequence, or the named device's when the caller's scope holds it.
   *
   * @throws InputInvalidError when the input names no device and the call came from no verified device.
   */
  async handle(
    input: DeviceAcknowledgedInput,
    ctx: QueryContext,
  ): Promise<DeviceAcknowledgedOutput> {
    const deviceId = input.deviceId ?? ctx.deviceId;
    if (deviceId === undefined)
      throw InputInvalidError.create(
        {},
        { fieldErrors: { deviceId: "a device id, or a call from a verified device" } },
      );
    const last = await this.sequences.last(deviceId);
    const shown =
      last !== undefined && (input.deviceId === undefined || isVisible(last.scope, ctx.scope));
    return DeviceAcknowledgedOutput.create({ sequence: shown ? last.sequence : null });
  }
}
