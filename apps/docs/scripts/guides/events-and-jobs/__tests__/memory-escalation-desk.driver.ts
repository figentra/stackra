/**
 * Stackra file contract:
 * Purpose: `MemoryEscalationDeskDriver`, the guide's in-memory on-call tool: it keeps the pages and reports it took,
 *          and refuses reports `unavailable` while `down` is set, as a tool in an outage does.
 * Boundary: test support only; one instance per compiled testing app.
 * Runtime: node (vitest)
 * Governing contract: ADR 0263 (memory drivers); ADR 0266 (memory first); STA-2852.
 */
import { Driver } from "@stackra/container";

import { EscalationDesk } from "../escalation-desk.port";
import { DeskUnavailableError } from "./desk-unavailable.error";

/** An on-call tool in memory. */
export class MemoryEscalationDeskDriver extends Driver(EscalationDesk) {
  /** The pages taken, as `ticketId:reason`. */
  readonly pages: string[] = [];

  /** The reports filed. */
  readonly reports: string[] = [];

  /** How many report calls were refused. */
  refused = 0;

  /** While true, every report is refused. */
  down = false;

  /** Keeps the page. */
  async page(ticketId: string, reason: string): Promise<void> {
    this.pages.push(`${ticketId}:${reason}`);
  }

  /** Keeps the report, or refuses it while down. */
  async report(ticketId: string): Promise<void> {
    if (this.down) {
      this.refused += 1;
      throw DeskUnavailableError.create();
    }
    this.reports.push(ticketId);
  }
}
