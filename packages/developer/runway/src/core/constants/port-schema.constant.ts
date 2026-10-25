/**
 * Stackra file contract:
 * Purpose: `PORT_SCHEMA`, a TCP port number (1 to 65535), for the dev ports of member runways and of the resolved
 *          runway facts.
 * Boundary: internal; the runway schemas compose it.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: the dev port is a member value).
 */
import { z } from "zod";

/** An integer port from 1 to 65535. */
export const PORT_SCHEMA = z.int().min(1).max(65_535);
