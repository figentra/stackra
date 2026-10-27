/**
 * Stackra file contract:
 * Purpose: `PERIPHERALS_CONFIG_SCHEMA`, the zod schema this package ships for `PeripheralsConfig` (exported as
 *          `PeripheralsConfig$`): the drivers, the receipt and label printers' addresses, the named kitchen printers,
 *          the bump bar's key map, the scale presets, the drawer pin, the scanner's key gap and the boot probe.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `PeripheralsConfig$` extends it. The defaults equal
 *           `PeripheralsOptions`' initializers (tested). An address is empty, `tcp://<host>:<port>` or an absolute
 *           device path; nothing here is a secret. A kitchen station is on one printer at most. No object-level
 *           refinement (a host extends the shape), so a `scalePreset` naming no entry is refused where it is read
 *           (`fitScaleReading`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0253 (decision 4); ADR 0266
 *                     (decision 5: config picks the driver); ADR 0449 (decisions 1 to 3).
 */
import { Duration, Enum } from "@stackra/contracts";
import { z } from "zod";

import { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";
import { PERIPHERAL_DRIVERS } from "#core/constants/peripheral-drivers.constant";

/** No printer, a network printer (`tcp://10.0.0.20:9100`), or a device path (`/dev/usb/lp0`, `\\localhost\Receipt`). */
const PRINTER_ADDRESS = /^$|^tcp:\/\/[^\s/]+:\d{1,5}$|^[/\\]\S/;

/** A snake_case name (a kitchen printer, a scale preset). */
const KEY = z.string().regex(/^[a-z][a-z0-9_]*$/);

/** One beep count or length step of an ESC/POS buzzer (`ESC B n t`). */
const BUZZ_STEP = z.int().min(1).max(9);

// shortcut: authored until gen compiles this package's PeripheralsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `PeripheralsConfig$`. */
export const PERIPHERALS_CONFIG_SCHEMA = z.object({
  printer: z.enum(PERIPHERAL_DRIVERS.printer).default("memory"),
  drawer: z.enum(PERIPHERAL_DRIVERS.drawer).default("memory"),
  scanner: z.enum(PERIPHERAL_DRIVERS.scanner).default("memory"),
  labelPrinter: z.enum(PERIPHERAL_DRIVERS.labelPrinter).default("memory"),
  customerDisplay: z.enum(PERIPHERAL_DRIVERS.customerDisplay).default("memory"),
  cardTerminal: z.enum(PERIPHERAL_DRIVERS.cardTerminal).default("memory"),
  accessController: z.enum(PERIPHERAL_DRIVERS.accessController).default("memory"),
  kitchenPrinter: z.enum(PERIPHERAL_DRIVERS.kitchenPrinter).default("memory"),
  bumpBar: z.enum(PERIPHERAL_DRIVERS.bumpBar).default("memory"),
  usedReceiptStore: z.enum(PERIPHERAL_DRIVERS.usedReceiptStore).default("memory"),
  printerAddress: z.string().regex(PRINTER_ADDRESS).default(""),
  labelPrinterAddress: z.string().regex(PRINTER_ADDRESS).default(""),
  kitchenPrinters: z
    .record(
      KEY,
      z.object({
        address: z.string().regex(PRINTER_ADDRESS).min(1),
        stations: z.array(KEY).min(1),
        buzz: z.object({ times: BUZZ_STEP, length: BUZZ_STEP }).nullable(),
      }),
    )
    .refine(
      (printers) => {
        const stations = Object.values(printers).flatMap((printer) => printer.stations);
        return new Set(stations).size === stations.length;
      },
      { message: "a kitchen station is on one printer at most" },
    )
    .default(() => ({})),
  bumpBarKeys: z.record(z.string().min(1), z.enum(Enum.values(BumpBarKey))).default(() => ({
    Enter: BumpBarKey.Bump,
    r: BumpBarKey.Recall,
    ArrowRight: BumpBarKey.Next,
    ArrowLeft: BumpBarKey.Previous,
    " ": BumpBarKey.Select,
  })),
  scalePresets: z
    .record(KEY, z.object({ division: z.number().positive(), capacity: z.number().positive() }))
    .default(() => ({
      retail: { division: 1, capacity: 15_000 },
      precision: { division: 0.01, capacity: 600 },
    })),
  scalePreset: KEY.default("retail"),
  drawerPin: z.union([z.literal(2), z.literal(5)]).default(2),
  scanKeyGap: z
    .custom<Duration>(
      (value) => typeof value === "string" && Duration.toMilliseconds(value as Duration) > 0,
      { message: "Expected an ISO 8601 duration above zero, such as PT0.05S" },
    )
    .default(Duration.seconds(0.05)),
  probeOnBoot: z.boolean().default(false),
  exitTokenPublicKey: z
    .string()
    .regex(/^$|^[A-Za-z0-9_-]{43}$/, "Expected a 32-byte Ed25519 public key as base64url, or empty")
    .default(""),
  exitTokenMaxAge: z
    .custom<Duration>(
      (value) => typeof value === "string" && Duration.toMilliseconds(value as Duration) > 0,
      { message: "Expected an ISO 8601 duration above zero, such as PT30M" },
    )
    .default(Duration.minutes(30)),
});
