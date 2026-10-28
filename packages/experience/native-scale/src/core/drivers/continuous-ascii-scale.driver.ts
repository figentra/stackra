/**
 * Stackra file contract:
 * Purpose: `ContinuousAsciiScaleDriver`, the `Scale` driver for scales that stream the A&D standard format
 *          (`nativeScale.protocol: "continuous_ascii"`) through the `StackraNativeScale` Expo module over Bluetooth
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
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Scale } from "@stackra/peripherals/contracts";
import type { ScaleReading } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { NativeScaleConfig } from "#config/native-scale.config";
import { connectScale } from "#core/functions/connect-scale.function";
import { isWeightOrFault } from "#core/functions/is-weight-or-fault.function";
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";
import { nativeScaleModule } from "#core/functions/native-scale-module.function";
import { parseContinuousAsciiLine } from "#core/functions/parse-continuous-ascii-line.function";
import { refuse } from "#core/functions/refuse.function";
import { requestScaleLine } from "#core/functions/request-scale-line.function";
import { sendScaleCommand } from "#core/functions/send-scale-command.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";
import type { ScaleFrame } from "#core/types/scale-frame.type";
import type { ScaleLine } from "#core/types/scale-line.type";

/** A weight line. */
type WeightLine = Extract<ScaleLine, { kind: "weight" }>;

/**
 * A scale streaming the A&D standard format.
 *
 * @example
 * // generated native wiring, ios and android targets
 * { port: Scale, selectedBy: "config:nativeScale.protocol", candidates: { continuous_ascii: () => import("@stackra/native-scale").then((m) => m.ContinuousAsciiScaleDriver) } }
 */
export class ContinuousAsciiScaleDriver extends Driver(Scale) {
  /** The native scale configuration. */
  private readonly config: NativeScaleConfig;

  /** The last tare line seen, in grams, or null. */
  private tareGrams: number | null = null;

  /**
   * @param config - the native scale configuration.
   */
  constructor(config: NativeScaleConfig) {
    super();
    this.config = config;
  }

  /** Answers when the link to the scale is open or opens now. */
  async probe(): Promise<CapabilityResult> {
    const linked = await connectScale(this.config);
    if (!linked.ok) return linked;
    return { ok: true, data: undefined };
  }

  /** The next streamed weight, settled or not. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return { ok: true, data: weightToReading(weight.data) };
  }

  /** The full reading: the weight in grams and as displayed, the stable flag, gross or net, and a sent tare. */
  async frame(): Promise<CapabilityResult<ScaleFrame>> {
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return {
      ok: true,
      data: {
        grams: weight.data.grams,
        value: weight.data.value,
        unit: weight.data.unit,
        isStable: weight.data.isStable,
        isNet: weight.data.isNet,
        tareGrams: this.tareGrams,
      },
    };
  }

  /** Streams each weight the scale sends until the returned function stops it. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    const protocol = this.config.protocols.continuous_ascii;
    const stop = listenScaleLines(nativeScaleModule(), protocol.terminator, (text) => {
      const line = parseContinuousAsciiLine(text);
      if (line?.kind === "tare") this.tareGrams = line.grams;
      if (line?.kind === "weight") listener(weightToReading(line));
    });
    void sendScaleCommand(this.config, protocol.streamStart, protocol.terminator);
    return stop;
  }

  /** The next weight line, after the pack's request command when one is set. */
  private async weigh(): Promise<CapabilityResult<WeightLine>> {
    const linked = await connectScale(this.config);
    if (!linked.ok) return linked;
    const protocol = this.config.protocols.continuous_ascii;
    const line = await requestScaleLine(linked.data, {
      command: protocol.request,
      terminator: protocol.terminator,
      parse: (text) => {
        const parsed = parseContinuousAsciiLine(text);
        if (parsed?.kind === "tare") this.tareGrams = parsed.grams;
        return parsed;
      },
      accept: isWeightOrFault,
      timeout: Duration.toMilliseconds(this.config.readTimeout),
    });
    if (line === null || line.kind === "fault") return refuse("unavailable");
    return { ok: true, data: line };
  }
}
