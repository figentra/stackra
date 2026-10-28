/**
 * Stackra file contract:
 * Purpose: `SCALE_SDK`, the scale lines the driver tests replay: MT-SICS answers (settled, moving, tare, overload,
 *          underload, busy, a syntax error) and A&D standard format stream lines (settled net and gross, moving,
 *          overload, a tare, counting mode), with `install`, which puts a stand-in `StackraNativeScale` Expo module
 *          on `globalThis.expo` that answers each written command with its scripted lines, and `uninstall`.
 * Boundary: test only. The lines are transcribed from Mettler Toledo's public MT-SICS reference and A&D's public
 *           interface manuals, never from a certified model; certification replaces them with recordings
 *           (STA-739). A test fixture is never a legal-for-trade reading. The module records every argument of
 *           every call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 5); ADR 0022 (test placement); ADR 0269 (fakes record every argument).
 */
import type { Mock } from "vitest";
import { vi } from "vitest";

import type { NativeScaleModule } from "#core/types/native-scale-module.type";

/** A data event as the module emits it. */
type DataEvent = { readonly text?: unknown };

/** The stand-in module: each `NativeScaleModule` method as a recording mock, plus the replay. */
type StandInScale = {
  readonly [K in keyof NativeScaleModule]: Mock<NativeScaleModule[K]>;
} & {
  /** Sends a data event to every listener now. */
  emit: (event: DataEvent) => void;
  /** The `remove` every `addListener` answer carries. */
  readonly remove: Mock<() => void>;
};

/** How the stand-in behaves. */
interface StandInOptions {
  /** The lines (without terminator) each written command (without terminator) answers. */
  readonly replies?: Readonly<Record<string, readonly string[]>>;
  /** Whether the link starts open. */
  readonly isConnected?: boolean;
  /** The code `connect` rejects with, or undefined to open. */
  readonly connectError?: string;
}

/** MT-SICS answer lines. */
const MT_SICS = {
  stableKg: "S S      1.250 kg",
  movingKg: "S D      1.180 kg",
  stableGrams: "S S     250.00 g",
  stableLb: "S S      2.000 lb",
  tareKg: "TA A      0.150 kg",
  noTare: "TA A      0.000 kg",
  overload: "S +",
  underload: "S -",
  busy: "S I",
  syntaxError: "ES",
  reset: 'I4 A "B123456789"',
} as const;

/** A&D standard format stream lines. */
const CONTINUOUS = {
  stableNetKg: "ST,NT,+0001.250kg",
  stableGrossGrams: "ST,GS,+00250.00  g",
  stableGrams: "ST,+00250.00  g",
  moving: "US,+00248.10  g",
  negative: "ST,-00001.20  g",
  overload: "OL,+9999999  g",
  tare: "ST,TR,+0000.150kg",
  counting: "QT,+0000012 PC",
} as const;

/** The fixture's written type: the declaration build cannot name vitest's internal `Procedure` from an inferred one. */
interface ScaleSdk {
  readonly mtSics: typeof MT_SICS;
  readonly continuous: typeof CONTINUOUS;
  /** Puts a stand-in `StackraNativeScale` on the Expo registry. */
  install: (options?: StandInOptions) => StandInScale;
  /** Removes the stand-in registry. */
  uninstall: () => void;
}

/** The recorded scale lines and the stand-in module. */
export const SCALE_SDK: ScaleSdk = {
  mtSics: MT_SICS,
  continuous: CONTINUOUS,

  /** Puts a stand-in `StackraNativeScale` on the Expo registry. */
  install(options: StandInOptions = {}): StandInScale {
    let listeners: Array<(event: DataEvent) => void> = [];
    const remove = vi.fn<() => void>(() => undefined);
    let isOpen = options.isConnected ?? false;
    const emit = (event: DataEvent): void => {
      for (const listener of listeners) listener(event);
    };
    const device: StandInScale = {
      connect: vi.fn<NativeScaleModule["connect"]>(async () => {
        if (options.connectError !== undefined)
          throw Object.assign(new Error("connect failed"), { code: options.connectError });
        isOpen = true;
      }),
      disconnect: vi.fn<NativeScaleModule["disconnect"]>(async () => {
        isOpen = false;
      }),
      isConnected: vi.fn<NativeScaleModule["isConnected"]>(async () => isOpen),
      write: vi.fn<NativeScaleModule["write"]>(async (text) => {
        const lines = options.replies?.[text.replace(/\r?\n$/, "")] ?? [];
        queueMicrotask(() => {
          for (const line of lines) emit({ text: `${line}\r\n` });
        });
      }),
      addListener: vi.fn<NativeScaleModule["addListener"]>((_eventName, listener) => {
        listeners = [...listeners, listener];
        return {
          remove: () => {
            remove();
            listeners = listeners.filter((entry) => entry !== listener);
          },
        };
      }),
      emit,
      remove,
    };
    (globalThis as { expo?: unknown }).expo = { modules: { StackraNativeScale: device } };
    return device;
  },

  /** Removes the stand-in registry. */
  uninstall(): void {
    delete (globalThis as { expo?: unknown }).expo;
  },
};
