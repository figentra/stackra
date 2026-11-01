/**
 * Stackra file contract:
 * Purpose: `DeliveryScope`, how `drainOutbox()` runs the delivery of one event: given the testing app, the event's
 *          meta and the scope it was written in, it runs `work` (deliver and drain the bus) the way the production
 *          inbox would, in a transaction as the event's actor in that scope (STA-1789).
 * Boundary: a type only; `@stackra/database`'s testing entry registers one with `deliverEventsIn`, so this package
 *           never depends on a database.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decision 4); ADR 0495 (isolation of a background unit).
 */
import type { TestingApp } from "@stackra/container/testing";
import type { ScopeRef } from "@stackra/contracts";

import type { EventMeta } from "#contracts/index";
import type { ListenerDelivery } from "#core/index";

/** Runs one event's delivery as the inbox would. */
export type DeliveryScope = (
  app: TestingApp,
  meta: Partial<EventMeta>,
  scope: ScopeRef | undefined,
  work: () => Promise<readonly ListenerDelivery[]>,
) => Promise<readonly ListenerDelivery[]>;
