/**
 * Stackra file contract:
 * Purpose: `OPEN_OBJECT_SCHEMA`, a block the canonical runway schemas leave open (`type: object` and nothing else):
 *          provider blocks, deploy targets, the edge, the release policy, a config class's values, Workers knobs.
 * Boundary: internal; the runway schemas compose it. Any keys and values pass and are kept; the command that reads
 *           the block checks its own part.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: the version 3 schemas of `tools/schemas/runway-*.schema.json`).
 */
import { z } from "zod";

/** A JSON object of anything. */
export const OPEN_OBJECT_SCHEMA = z.record(z.string(), z.unknown());
