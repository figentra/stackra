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
import { Duration } from "@stackra/contracts";
import type { ScaleReading } from "@stackra/peripherals/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { ProtocolScaleDriver } from "#core/drivers/protocol-scale.driver";
import { connectScale } from "#core/functions/connect-scale.function";
import { isTareOrFault } from "#core/functions/is-tare-or-fault.function";
import { listenScaleLines } from "#core/functions/listen-scale-lines.function";
import { nativeScaleModule } from "#core/functions/native-scale-module.function";
import { parseMtSicsLine } from "#core/functions/parse-mt-sics-line.function";
import { requestScaleLine } from "#core/functions/request-scale-line.function";
import { sendScaleCommand } from "#core/functions/send-scale-command.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";
import type { ScaleFrame } from "#core/types/scale-frame.type";
import type { ScaleLine } from "#core/types/scale-line.type";
import type { ScaleProtocol } from "#core/types/scale-protocol.type";

/**
 * An MT-SICS scale.
 *
 * @example
 * // generated native wiring, ios and android targets
 * { port: Scale, selectedBy: "config:native_scale.protocol", candidates: { mt_sics: () => import("@stackra/native-scale").then((m) => m.MtSicsScaleDriver) } }
 */
export class MtSicsScaleDriver extends ProtocolScaleDriver {
  /** How many `onWeight` listeners are running. */
  private streams = 0;

  /** The full reading: the net weight in grams and as displayed, the stable flag and the tare. */
  async frame(): Promise<CapabilityResult<ScaleFrame>> {
    const linked = await connectScale(this.config);
    if (!linked.ok) return linked;
    const protocol = this.protocol();
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
    return this.toFrame(weight.data, tareGrams === null ? null : tareGrams > 0, tareGrams);
  }

  /** Streams each reading from `SIR` until the returned function stops it. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    const protocol = this.protocol();
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

  /** The MT-SICS commands and terminator. */
  protected override protocol(): ScaleProtocol {
    return this.config.protocols.mt_sics;
  }

  /** One MT-SICS answer line. */
  protected override parse(text: string): ScaleLine | null {
    return parseMtSicsLine(text);
  }

  /** `SI`, or nothing while `SIR` runs, so a read takes the next streamed line instead of cancelling the stream. */
  protected override weighCommand(): string {
    return this.streams > 0 ? "" : this.protocol().request;
  }
}
