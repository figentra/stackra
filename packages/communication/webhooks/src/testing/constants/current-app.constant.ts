/**
 * Stackra file contract:
 * Purpose: `CURRENT_APP`, the testing app compiled last, which `deliverWebhook` delivers to.
 * Boundary: internal to `./testing`; set by the testing-module plugin on every compile.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";

/** The last compiled testing app; undefined before the first compile. */
export const CURRENT_APP: { value: TestingApp | undefined } = { value: undefined };
