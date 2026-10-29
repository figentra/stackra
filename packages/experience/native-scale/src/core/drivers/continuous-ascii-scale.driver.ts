/**
 * Stackra file contract:
 * Purpose: `ContinuousAsciiScaleDriver`, the `Scale` driver for scales that stream the A&D standard format
 *          (`native_scale.protocol: "continuous_ascii"`) through the `StackraNativeScale` Expo module over Bluetooth
 *          LE, Bluetooth serial or USB serial: `read` answers the next streamed weight (after sending the pack's
 *          `request` command when one is set, for an indicator in command mode), `onWeight` hands every streamed
 *          weight on, and `frame` adds the unit as displayed and the gross or net field.
 * Boundary: the terminator and the optional request command are `NativeScaleConfig.protocols.continuous_ascii`
 *           (configuration); the grammar is `parseContinuousAsciiLine`. The format carries no tare value, so
 *           `frame().tareGrams` is null unless the indicator sends a `TR` line first. No module, no address, no line
 *           within `readTimeout` or an `OL` line resolve the `serial` refusal `unavailable`; a refused Bluetooth or
 *           USB permission resolves `permission_denied`. Certification pending: built from A&D's public interface
 *           manuals (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2, 5 and 8); ADR 0253 (decisions 3 and 4); ADR 0250 (decision 3).
 */
import type { ScaleReading } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { ProtocolScaleDriver } from "#core/drivers/protocol-scale.driver";
import { ScaleProtocolName } from "#core/enums/scale-protocol-name.enum";
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";
import { nativeScaleModule } from "#core/functions/native-scale-module.function";
import { parseContinuousAsciiLine } from "#core/functions/parse-continuous-ascii-line.function";
import { sendScaleCommand } from "#core/functions/send-scale-command.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";
import type { ScaleFrame } from "#core/types/scale-frame.type";
import type { ScaleLine } from "#core/types/scale-line.type";
import type { ScaleProtocol } from "#core/types/scale-protocol.type";

/**
 * A scale streaming the A&D standard format.
 *
 * @example
 * // generated native wiring, ios and android targets
 * { port: Scale, selectedBy: "config:native_scale.protocol", candidates: { continuous_ascii: () => import("@stackra/native-scale").then((m) => m.ContinuousAsciiScaleDriver) } }
 */
export class ContinuousAsciiScaleDriver extends ProtocolScaleDriver {
  /** The last tare line seen, in grams, or null. */
  private tareGrams: number | null = null;

  /** The full reading: the weight in grams and as displayed, the stable flag, gross or net, and a sent tare. */
  async frame(): Promise<CapabilityResult<ScaleFrame>> {
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return this.toFrame(weight.data, weight.data.isNet, this.tareGrams);
  }

  /** Streams each weight the scale sends until the returned function stops it. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    const protocol = this.protocol();
    const stop = listenScaleLines(nativeScaleModule(), protocol.terminator, (text) => {
      const line = this.parse(text);
      if (line?.kind === "weight") listener(weightToReading(line));
    });
    void sendScaleCommand(this.config, this.permissions, protocol.streamStart, protocol.terminator);
    return stop;
  }

  /** The continuous ASCII terminator and optional request command. */
  protected override protocol(): ScaleProtocol {
    return this.config.protocols[ScaleProtocolName.ContinuousAscii];
  }

  /** One line of the stream; a tare line is remembered for `frame`. */
  protected override parse(text: string): ScaleLine | null {
    const line = parseContinuousAsciiLine(text);
    if (line?.kind === "tare") this.tareGrams = line.grams;
    return line;
  }
}
