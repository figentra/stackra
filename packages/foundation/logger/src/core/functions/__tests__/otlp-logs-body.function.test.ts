/**
 * Stackra file contract:
 * Purpose: unit tests of `otlpLogsBody`: one resource with `service.name` when set, one `@stackra/logger` scope, and
 *          per record the time in nanoseconds, the severity number and text, the event as body, and the channel and
 *          fields as attributes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { LogLevel } from "#contracts/enums/log-level.enum";
import { otlpLogsBody } from "#core/functions/otlp-logs-body.function";

const RECORD = {
  time: "2026-10-25T09:00:00.000Z",
  level: LogLevel.Warn,
  event: "orders.draft_priced",
  channel: "orders",
  fields: { lines: 3 },
};

describe("otlpLogsBody", () => {
  it("writes the export request", () => {
    expect(otlpLogsBody([RECORD], "orders")).toEqual({
      resourceLogs: [
        {
          resource: { attributes: [{ key: "service.name", value: { stringValue: "orders" } }] },
          scopeLogs: [
            {
              scope: { name: "@stackra/logger" },
              logRecords: [
                {
                  timeUnixNano: `${Date.parse(RECORD.time)}000000`,
                  severityNumber: 13,
                  severityText: "WARN",
                  body: { stringValue: "orders.draft_priced" },
                  attributes: [
                    { key: "log.channel", value: { stringValue: "orders" } },
                    { key: "lines", value: { intValue: "3" } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("leaves service.name out when empty", () => {
    const body = otlpLogsBody([], "") as {
      resourceLogs: { resource: { attributes: unknown[] } }[];
    };
    expect(body.resourceLogs[0]?.resource.attributes).toEqual([]);
  });
});
