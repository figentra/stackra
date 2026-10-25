/**
 * Stackra file contract:
 * Purpose: the `DeviceCommands` port: a device takes the commands the hub queued for it and acknowledges each.
 * Boundary: an abstract class that is its own token; drivers implement it with `extends Driver(DeviceCommands)`. The
 *           HTTP driver polls; an MQTT driver later pushes, behind this same port (ADR 0235). A command stays pending
 *           until it is acknowledged, so a device that crashes mid-command sees it again.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { CommandStatus } from "#contracts/enums/command-status.enum";
import type { DeviceCommand } from "#contracts/types/device-command.type";

/**
 * Takes and acknowledges commands.
 *
 * @example
 * for (const command of await this.commands.pending()) {
 *   const status = await this.run(command);
 *   await this.commands.acknowledge(command.id, status);
 * }
 */
export abstract class DeviceCommands extends Port {
  /** The commands queued for this device and not yet acknowledged, oldest first. */
  abstract pending(): Promise<readonly DeviceCommand[]>;

  /**
   * Ends command `commandId` with `status`; acknowledging a command twice with the same status changes nothing.
   *
   * @param detail - a short reason for the hub's log (`disk full`); never a secret.
   */
  abstract acknowledge(commandId: string, status: CommandStatus, detail?: string): Promise<void>;
}
