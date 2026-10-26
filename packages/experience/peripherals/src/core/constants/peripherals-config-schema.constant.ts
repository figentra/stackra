/**
 * Stackra file contract:
 * Purpose: `PERIPHERALS_CONFIG_SCHEMA`, the zod schema this package ships for `PeripheralsConfig` (exported as
 *          `PeripheralsConfig$`): the six drivers, the receipt and label printers' addresses, the drawer pin, the
 *          scanner's key gap and the boot probe.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `PeripheralsConfig$` extends it. The defaults equal
 *           `PeripheralsOptions`' initializers (tested). An address is empty, `tcp://<host>:<port>` or an absolute
 *           device path; nothing here is a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0253 (decision 4); ADR 0266
 *                     (decision 5: config picks the driver).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { PERIPHERAL_DRIVERS } from "#core/constants/peripheral-drivers.constant";

/** No printer, a network printer (`tcp://10.0.0.20:9100`), or a device path (`/dev/usb/lp0`, `\\localhost\Receipt`). */
const PRINTER_ADDRESS = /^$|^tcp:\/\/[^\s/]+:\d{1,5}$|^[/\\]\S/;

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
  printerAddress: z.string().regex(PRINTER_ADDRESS).default(""),
  labelPrinterAddress: z.string().regex(PRINTER_ADDRESS).default(""),
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
