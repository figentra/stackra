/**
 * Stackra file contract:
 * Purpose: `FiscalDevice`, the port to a fiscal unit outside the till's code: a TSE, a fiscal data module, a telematic
 *          printer, local or in the cloud.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalDevice`. Pairing and the device registry are
 *           `@stackra/devices`' (handover conflict 3); the host binds this port over the paired device. Commands are
 *           the driver's (`tse.transaction`); the answer is unvalidated and each driver parses it. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 5).
 */
import { Port } from "@stackra/contracts";

/**
 * Sends one command to the unit's paired fiscal device.
 *
 * @example
 * const answer = await device.call("till_1", "tse.transaction", { processType, processData });
 */
export abstract class FiscalDevice extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalDevice";

  /** The device's answer; throws when no device is paired with the unit or it does not answer. */
  abstract call(
    unitId: string,
    command: string,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<unknown>;
}
