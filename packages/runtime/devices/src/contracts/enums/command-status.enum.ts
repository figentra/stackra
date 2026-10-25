/**
 * Stackra file contract:
 * Purpose: `CommandStatus`, how a device ended a command it acknowledges through `DeviceCommands.acknowledge`.
 * Boundary: an `Enum.of` value plus the type of the same name; the codes are the wire values the hub stores.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2: the command port); ADR 0294 (decision 16: enums).
 */
import { Enum } from "@stackra/contracts";

/**
 * The end of a command.
 *
 * @example
 * await commands.acknowledge(command.id, CommandStatus.Failed, "disk full");
 */
export const CommandStatus = Enum.of({
  /** The device ran it. */
  Done: "done",
  /** The device tried and it failed. */
  Failed: "failed",
  /** The device did not run it: unknown, malformed or expired. */
  Rejected: "rejected",
});

/** One of the codes above. */
export type CommandStatus = Enum.Value<typeof CommandStatus>;
