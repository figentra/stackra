/**
 * Stackra file contract:
 * Purpose: `CONFIG_VALUES_SCHEMA`, the `config` map of a runway environment: config key (`commerce`,
 *          `logger.telemetry`, `loyalty_kit`) to the field values that set that config class, the last layer of
 *          configuration.
 * Boundary: internal. Only the keys are checked here; the values are checked against each config class's schema when
 *           `buildConfig` applies them, because runway does not know the classes.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0294 (decision 19: values are the last config layer; decision 20:
 *                     derived config keys).
 */
import { z } from "zod";

/** Config key to its field values. */
export const CONFIG_VALUES_SCHEMA = z.record(
  z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, "Expected a config key"),
  z.record(z.string(), z.unknown()),
);
