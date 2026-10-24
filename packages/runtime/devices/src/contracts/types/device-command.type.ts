/**
 * Stackra file contract:
 * Purpose: `DeviceCommand`, one instruction the hub queued for this device, as `DeviceCommands.pending()` returns it.
 * Boundary: a type only. The payload is JSON the device's own handler checks; this package never interprets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2: the command port).
 */
import type { Json } from "@stackra/contracts";

/**
 * One queued instruction.
 *
 * @example
 * for (const command of await commands.pending()) {
 *   if (command.name === "reboot") await reboot();
 *   await commands.acknowledge(command.id, CommandStatus.Done);
 * }
 */
export interface DeviceCommand {
  /** The hub's id of the command, given back to `acknowledge`. */
  readonly id: string;

  /** What to do, snake_case (`reboot`, `set_interval`). */
  readonly name: string;

  /** The command's arguments. */
  readonly payload: Readonly<Record<string, Json>>;

  /** When the hub queued it. */
  readonly issuedAt: Date;

  /** After this instant the device rejects it instead of running it; `null` when it never expires. */
  readonly expiresAt: Date | null;
}
