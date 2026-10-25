/**
 * Stackra file contract:
 * Purpose: `TelemetryReading`, one measurement a device reports through the `DeviceTelemetry` port.
 * Boundary: a type only. It names no device: the hub reads the device from its credential, never from the body
 *           (ADR 0235 decision 1). On the wire `at` is an ISO 8601 date-time.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2: the telemetry port).
 */

/**
 * One measurement a device reports.
 *
 * @example
 * const reading: TelemetryReading = { metric: "temperature", value: 21.5, unit: "celsius", at: clock.now() };
 */
export interface TelemetryReading {
  /** What was measured, snake_case (`temperature`, `door_open`). */
  readonly metric: string;

  /** The measured value. */
  readonly value: number | string | boolean;

  /** The unit of a numeric value (`celsius`, `percent`), when it has one. */
  readonly unit?: string;

  /** When the device took the measurement. */
  readonly at: Date;
}
