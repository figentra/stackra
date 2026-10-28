/**
 * Stackra file contract:
 * Purpose: `MtSicsScaleDriver`, the `Scale` driver for scales that speak Mettler Toledo's MT-SICS
 *          (`native_scale.protocol: "mt_sics"`) through the `StackraNativeScale` Expo module over Bluetooth LE,
 *          Bluetooth serial or USB serial: `read` sends `SI` and answers the settled or moving net weight, `onWeight`
 *          starts `SIR` for the first listener and sends `@` after the last, and `frame` adds the unit as displayed
 *          and the tare (`TA`) for a legal-for-trade record.
 * Boundary: the commands and terminator are `NativeScaleConfig.protocols.mt_sics` (configuration); the answer grammar
 *           is `parseMtSicsLine`. No module, no address, no answer within `readTimeout`, an overload, an underload, a
 *           busy scale or a command error resolve the `serial` refusal `unavailable`; a refused Bluetooth or USB
 *           permission resolves `permission_denied`. A read while the stream runs takes the next streamed line
 *           instead of cancelling `SIR`. Certification pending: built from the public MT-SICS reference (STA-739).
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
import { isTareOrFault } from "#core/functions/is-tare-or-fault.function";
import { isWeightOrFault } from "#core/functions/is-weight-or-fault.function";
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";
import { nativeScaleModule } from "#core/functions/native-scale-module.function";
import { parseMtSicsLine } from "#core/functions/parse-mt-sics-line.function";
import { refuse } from "#core/functions/refuse.function";
import { requestScaleLine } from "#core/functions/request-scale-line.function";
import { sendScaleCommand } from "#core/functions/send-scale-command.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";
import type { ScaleFrame } from "#core/types/scale-frame.type";
import type { ScaleLine } from "#core/types/scale-line.type";

/** A weight line. */
type WeightLine = Extract<ScaleLine, { kind: "weight" }>;

/**
 * An MT-SICS scale.
 *
 * @example
 * // generated native wiring, ios and android targets
 * { port: Scale, selectedBy: "config:native_scale.protocol", candidates: { mt_sics: () => import("@stackra/native-scale").then((m) => m.MtSicsScaleDriver) } }
 */
export class MtSicsScaleDriver extends Driver(Scale) {
  /** The native scale configuration. */
  private readonly config: NativeScaleConfig;

  /** How many `onWeight` listeners are running. */
  private streams = 0;

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

  /** The net weight now, settled or not. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return { ok: true, data: weightToReading(weight.data) };
  }

  /** The full reading: the net weight in grams and as displayed, the stable flag and the tare. */
  async frame(): Promise<CapabilityResult<ScaleFrame>> {
    const linked = await connectScale(this.config);
    if (!linked.ok) return linked;
    const protocol = this.config.protocols.mt_sics;
    let tareGrams: number | null = null;
    if (protocol.tareQuery !== "") {
      const tare = await requestScaleLine(linked.data, {
        command: protocol.tareQuery,
        terminator: protocol.terminator,
        parse: parseMtSicsLine,
        accept: isTareOrFault,
        timeout: Duration.toMilliseconds(this.config.readTimeout),
      });
      if (tare?.kind === "tare") tareGrams = tare.grams;
      // reason: on a scale that runs SIR, any other command ends the stream, so it is started again.
      if (this.streams > 0 && protocol.streamStart !== "")
        await sendScaleCommand(this.config, protocol.streamStart, protocol.terminator);
    }
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return {
      ok: true,
      data: {
        grams: weight.data.grams,
        value: weight.data.value,
        unit: weight.data.unit,
        isStable: weight.data.isStable,
        isNet: tareGrams === null ? null : tareGrams > 0,
        tareGrams,
      },
    };
  }

  /** Streams each reading from `SIR` until the returned function stops it. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    const protocol = this.config.protocols.mt_sics;
    const stop = listenScaleLines(nativeScaleModule(), protocol.terminator, (text) => {
      const line = parseMtSicsLine(text);
      if (line?.kind === "weight") listener(weightToReading(line));
    });
    this.streams += 1;
    if (this.streams === 1)
      void sendScaleCommand(this.config, protocol.streamStart, protocol.terminator);
    let isStopped = false;
    return () => {
      if (isStopped) return;
      isStopped = true;
      stop();
      this.streams -= 1;
      if (this.streams === 0 && protocol.streamStop !== "")
        void sendScaleCommand(this.config, protocol.streamStop, protocol.terminator);
    };
  }

  /** One weight line: requested with `SI`, or the next streamed line while `SIR` runs. */
  private async weigh(): Promise<CapabilityResult<WeightLine>> {
    const linked = await connectScale(this.config);
    if (!linked.ok) return linked;
    const protocol = this.config.protocols.mt_sics;
    const line = await requestScaleLine(linked.data, {
      command: this.streams > 0 ? "" : protocol.request,
      terminator: protocol.terminator,
      parse: parseMtSicsLine,
      accept: isWeightOrFault,
      timeout: Duration.toMilliseconds(this.config.readTimeout),
    });
    if (line === null || line.kind === "fault") return refuse("unavailable");
    return { ok: true, data: line };
  }
}
