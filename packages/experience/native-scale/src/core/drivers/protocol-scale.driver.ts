/**
 * Stackra file contract:
 * Purpose: `ProtocolScaleDriver`, the base of the `Scale` drivers that read a text-line scale protocol through the
 *          `StackraNativeScale` Expo module (MT-SICS, the continuous ASCII stream): it holds the configuration,
 *          answers `probe` and `read`, requests one weight line for its subclass, and shapes a `ScaleFrame`.
 * Boundary: the subclass names its protocol's configuration and grammar, and writes `frame` and `onWeight`. No module,
 *           no address, no weight line within `readTimeout` or a fault line resolve the `serial` refusal
 *           `unavailable`; Bluetooth is asked through the injected `DevicePermissions` before a `ble` or `spp` link
 *           opens, and a denied or blocked answer, or a refused Bluetooth or USB permission, resolves
 *           `permission_denied`. Internal: the barrel exports the subclasses only.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2, 5 and 8); ADR 0253 (decisions 3 and 4); ADR 0250 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { Scale } from "@stackra/peripherals/contracts";
import type { ScaleReading } from "@stackra/peripherals/contracts";
import type { CapabilityResult, DevicePermissions } from "@stackra/platform/contracts";

import type { NativeScaleConfig } from "#config/native-scale.config";
import { connectScale } from "#core/functions/connect-scale.function";
import { isWeightOrFault } from "#core/functions/is-weight-or-fault.function";
import { refuse } from "#core/functions/refuse.function";
import { requestScaleLine } from "#core/functions/request-scale-line.function";
import { weightToReading } from "#core/functions/weight-to-reading.function";
import type { ScaleFrame } from "#core/types/scale-frame.type";
import type { ScaleLine } from "#core/types/scale-line.type";
import type { ScaleProtocol } from "#core/types/scale-protocol.type";

/** A weight line. */
type WeightLine = Extract<ScaleLine, { kind: "weight" }>;

/**
 * A scale that speaks a text-line protocol, named by its subclass.
 *
 * @example
 * export class MtSicsScaleDriver extends ProtocolScaleDriver {
 *   protected override protocol(): ScaleProtocol { return this.config.protocols.mt_sics; }
 *   protected override parse(text: string): ScaleLine | null { return parseMtSicsLine(text); }
 * }
 */
export abstract class ProtocolScaleDriver extends Driver(Scale) {
  /** The native scale configuration. */
  protected readonly config: NativeScaleConfig;

  /** The app's permission helper, asked for Bluetooth before a Bluetooth link opens. */
  protected readonly permissions: DevicePermissions;

  /**
   * @param config - the native scale configuration.
   * @param permissions - the app's `DevicePermissions`, asked for Bluetooth before a `ble` or `spp` link opens.
   */
  constructor(config: NativeScaleConfig, permissions: DevicePermissions) {
    super();
    this.config = config;
    this.permissions = permissions;
  }

  /** Answers when the link to the scale is open or opens now. */
  async probe(): Promise<CapabilityResult> {
    const linked = await connectScale(this.config, this.permissions);
    if (!linked.ok) return linked;
    return { ok: true, data: undefined };
  }

  /** The net weight now, settled or not. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    const weight = await this.weigh();
    if (!weight.ok) return weight;
    return { ok: true, data: weightToReading(weight.data) };
  }

  /** The protocol's commands and terminator, from the configuration. */
  protected abstract protocol(): ScaleProtocol;

  /** One line of the protocol's grammar, or `null` when the text is not one. */
  protected abstract parse(text: string): ScaleLine | null;

  /** The command that asks for one weight line; the protocol's `request` unless the subclass says otherwise. */
  protected weighCommand(): string {
    return this.protocol().request;
  }

  /** One weight line, after `weighCommand` when it is not empty. */
  protected async weigh(): Promise<CapabilityResult<WeightLine>> {
    const linked = await connectScale(this.config, this.permissions);
    if (!linked.ok) return linked;
    const line = await requestScaleLine(linked.data, {
      command: this.weighCommand(),
      terminator: this.protocol().terminator,
      parse: (text) => this.parse(text),
      accept: isWeightOrFault,
      timeout: Duration.toMilliseconds(this.config.readTimeout),
    });
    if (line === null || line.kind === "fault") return refuse("unavailable");
    return { ok: true, data: line };
  }

  /** The full reading of `weight`, with the gross or net flag and the tare the protocol could tell. */
  protected toFrame(
    weight: WeightLine,
    isNet: boolean | null,
    tareGrams: number | null,
  ): CapabilityResult<ScaleFrame> {
    return {
      ok: true,
      data: {
        grams: weight.grams,
        value: weight.value,
        unit: weight.unit,
        isStable: weight.isStable,
        isNet,
        tareGrams,
      },
    };
  }
}
