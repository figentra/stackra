/**
 * Stackra file contract:
 * Purpose: `otlpLogsBody(records, serviceName)`, the OTLP/JSON `ExportLogsServiceRequest` for a batch of records: one
 *          resource (with `service.name` when set), one scope (`@stackra/logger`), and per record its time in
 *          nanoseconds, its severity, the event as the body and the channel and fields as attributes.
 * Boundary: pure. The records were redacted by the logger before they reached a reporter, so their fields are written
 *           as they are.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 and 2); ADR 0147 (decision 3: attributes carry no values beyond the
 *                     dictionary); the OTLP/JSON encoding.
 */
import { LogLevel } from "#contracts/enums/log-level.enum";
import type { LogRecord } from "#contracts/types/log-record.type";
import { otlpValue } from "#core/functions/otlp-value.function";

/** OpenTelemetry severity numbers by level. */
const SEVERITY: Readonly<Record<LogLevel, number>> = {
  [LogLevel.Debug]: 5,
  [LogLevel.Info]: 9,
  [LogLevel.Warn]: 13,
  [LogLevel.Error]: 17,
};

/**
 * The export request of `records`.
 *
 * @example
 * await fetch(`${endpoint}/v1/logs`, { method: "POST", body: JSON.stringify(otlpLogsBody(batch, "orders")) });
 */
export function otlpLogsBody(records: readonly LogRecord[], serviceName: string): object {
  return {
    resourceLogs: [
      {
        resource: {
          attributes:
            serviceName === ""
              ? []
              : [{ key: "service.name", value: { stringValue: serviceName } }],
        },
        scopeLogs: [
          {
            scope: { name: "@stackra/logger" },
            logRecords: records.map((record) => ({
              timeUnixNano: `${BigInt(Date.parse(record.time)) * 1_000_000n}`,
              severityNumber: SEVERITY[record.level],
              severityText: record.level.toUpperCase(),
              body: { stringValue: record.event },
              attributes: [
                { key: "log.channel", value: { stringValue: record.channel } },
                ...Object.entries(record.fields).map(([key, value]) => ({
                  key,
                  value: otlpValue(value),
                })),
              ],
            })),
          },
        ],
      },
    ],
  };
}
