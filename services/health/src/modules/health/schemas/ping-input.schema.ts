/**
 * Stackra file contract:
 * Purpose: `PingInput`, the input of `health.ping.check@1`: nothing.
 * Boundary: a shape class in its own file; built with `PingInput.create({})`.
 * Runtime: node
 * Governing contract: ADR 0294 (as amended by programming model v3.1, AGENTS.md); ADR 0305 (one declaration per file).
 */
import { Schema } from "@stackra/validation";

/** A ping carries no input. */
export class PingInput extends Schema {}
