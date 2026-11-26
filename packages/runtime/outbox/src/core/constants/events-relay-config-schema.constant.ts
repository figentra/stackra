/**
 * Stackra file contract:
 * Purpose: `EVENTS_RELAY_CONFIG_SCHEMA`, the zod schema of `EventsRelayConfig`: one environment's cross-app relay of a
 *          producer, the shape of runway's `events` block (the signing key's secret name, the public keys, current
 *          first, and the subscribers with their inbox origins and events).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so a service with no relay
 *           configuration gets no subscriber and publishes nothing across apps. Runway's own schema
 *           (`SERVICE_EVENTS_SCHEMA`) is the strict one at deploy time; this one checks the shape at boot. Names and
 *           public facts only: the signing key's value never appears here (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 17, amendment of 2026-11-02); ADR 0294 (decision 26); ADR 0173.
 */
import { z } from "zod";

/** The shipped `EventsRelayConfig$`. */
export const EVENTS_RELAY_CONFIG_SCHEMA = z.object({
  signingKey: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/)
    .default("STACKRA_EVENTS_SIGNING_KEY"),
  keys: z.array(z.object({ id: z.string().min(1), publicKey: z.string().min(1) })).default([]),
  subscribers: z
    .array(
      z.object({
        member: z.string().min(1),
        inbox: z.url(),
        events: z.array(z.string().min(1)),
      }),
    )
    .default([]),
});
