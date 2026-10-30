/**
 * Stackra file contract:
 * Purpose: the `SmokeDriver` port: checks one smoke subject of its target (`web`, `mobile` or `desktop`) after a
 *          preview deploy and answers what it found.
 * Boundary: an abstract class that is its own token; the Playwright (web), Maestro (mobile) and placeholder Electron
 *           (desktop) drivers are `@stackra/runway/node`'s. A driver reports a failure as a result; it throws only
 *           when it cannot run at all.
 * Runtime: isomorphic
 * Governing contract: STA-265 spec (D6, FR-008); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { SmokeResult } from "#core/types/smoke-result.type";
import type { SmokeSubject } from "#core/types/smoke-subject.type";

/** A smoke check of one target. */
export abstract class SmokeDriver extends Port {
  /** The target this driver checks. */
  abstract readonly target: SmokeSubject["target"];

  /** Checks `subject`, leaving its evidence under `repository`. */
  abstract check(subject: SmokeSubject, repository: string): Promise<SmokeResult>;
}
