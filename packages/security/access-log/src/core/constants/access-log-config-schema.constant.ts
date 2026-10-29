/**
 * Stackra file contract:
 * Purpose: `ACCESS_LOG_CONFIG_SCHEMA`, the zod schema this package ships for `AccessLogConfig` (exported as
 *          `AccessLogConfig$`): which sink runs, how many days a record is kept, and which data classes fail closed.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated schema can `.extend` it; the defaults equal `AccessLogOptions`'
 *           initializers (tested). The retention floor is 90 days and the default 400, about the thirteen months hot
 *           that ADR 0212 decision 6 keeps. `failClosed` defaults to financial, health and regulated (the special
 *           categories and regulator-issued identifiers, STA-1300), the classes whose read must not be served unlogged (ADR 0409); a market pack or a tenant's
 *           deployment narrows or widens it through runway's `config.access_log` layer. `auditRetentionDays` has no
 *           default on purpose: the owner states it (STA-1579); unset means kept without limit. `exportUrl` is an
 *           HTTPS URL or unset, and `exportToken` is the `ACCESS_LOG_EXPORT_TOKEN` secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0212 (decision 6: retention); ADR 0409
 *                     (fail-closed classes, STA-821); ADR 0173; STA-1579 (audit retention and export).
 */
import { DataClassification, Enum } from "@stackra/contracts";
import { z } from "zod";

import { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

/** The shipped `AccessLogConfig$`. */
export const ACCESS_LOG_CONFIG_SCHEMA = z.object({
  sink: z.enum(ACCESS_LOG_SINK_DRIVERS).default("postgres"),
  retentionDays: z.number().int().min(90).default(400),
  failClosed: z
    .array(z.enum(Enum.values(DataClassification) as [DataClassification, ...DataClassification[]]))
    .default([
      DataClassification.Financial,
      DataClassification.Health,
      DataClassification.Regulated,
    ]),
  auditRetentionDays: z.number().int().min(1).exactOptional(),
  exportUrl: z.union([z.url({ protocol: /^https$/ }), z.literal("")]).default(""),
  exportToken: z.string().default(""),
});
