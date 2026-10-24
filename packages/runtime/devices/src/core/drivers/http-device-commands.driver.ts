/**
 * Stackra file contract:
 * Purpose: the HTTP driver of the `DeviceCommands` port: `GET /device-commands` for the pending commands and
 *          `PUT /device-commands/:id/acknowledge` with `{ status, detail? }` to end one.
 * Boundary: calls through `hubSender`. The pending body comes from outside, so it is parsed with
 *           `DEVICE_COMMAND_LIST_SCHEMA` (a malformed body throws `ZodError`). Acknowledging is a `PUT`, idempotent,
 *           so `retry` repeats it. The driver polls when asked; it keeps no timer and no state.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2: the HTTP driver ships now); ADR 0294 (decision 17: drivers).
 */
import { Driver } from "@stackra/container";

import { DevicesConfig } from "#config/devices.config";
import type { CommandStatus } from "#contracts/enums/command-status.enum";
import { DeviceCommands } from "#contracts/ports/device-commands.port";
import { DeviceCredential } from "#contracts/ports/device-credential.port";
import type { DeviceCommand } from "#contracts/types/device-command.type";
import { DEVICE_COMMAND_LIST_SCHEMA } from "#core/constants/device-command-list-schema.constant";
import { DEVICE_HUB_PATHS } from "#core/constants/device-hub-paths.constant";
import { hubSender } from "#core/functions/hub-sender.function";

/** Takes and acknowledges commands over HTTP. */
export class HttpDeviceCommandsDriver extends Driver(DeviceCommands) {
  private readonly send: ReturnType<typeof hubSender>;

  /**
   * @param config - the hub URL, timeout and attempts.
   * @param credential - the device's token.
   * @throws TypeError when `config.hubUrl` is `null`.
   */
  constructor(config: DevicesConfig, credential: DeviceCredential) {
    super();
    this.send = hubSender(config, credential);
  }

  /** The commands the hub has pending for this device, oldest first. */
  async pending(): Promise<readonly DeviceCommand[]> {
    const response = await this.send(DEVICE_HUB_PATHS.commands);
    return DEVICE_COMMAND_LIST_SCHEMA.parse(await response.json()).items;
  }

  /** Ends command `commandId` with `status` and an optional short `detail`. */
  async acknowledge(commandId: string, status: CommandStatus, detail?: string): Promise<void> {
    const response = await this.send(DEVICE_HUB_PATHS.acknowledge(commandId), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(detail === undefined ? { status } : { status, detail }),
    });
    await response.body?.cancel();
  }
}
