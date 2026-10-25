/**
 * Stackra file contract:
 * Purpose: `CONFIG_VALUES_SCHEMA`, the `config` map of a runway environment (and of the root `defaults.service`):
 *          config key (`commerce`, `logger.telemetry`, `loyalty_kit`) to the field values that set that config class,
 *          the last layer of configuration.
 * Boundary: internal. The canonical schemas leave the keys and the values open: the values are checked against each
 *           config class's schema when `buildConfig` applies them, because runway does not know the classes.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0294 (decision 19: values are the last config layer), ADR 0146.
 */
import { z } from "zod";

import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";

/** Config key to its field values. */
export const CONFIG_VALUES_SCHEMA = z.record(z.string(), OPEN_OBJECT_SCHEMA);
