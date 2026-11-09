/**
 * Stackra file contract:
 * Purpose: `SERVICE_EVENTS_SCHEMA`, the `events` block of one service environment: what the cross-app relay of a
 *          producer needs there. The secret name of its signing key, its public keys (current first, then the next one
 *          during a rotation) and the consumers in other apps it delivers to, each with its inbox origin and the
 *          integration events it takes.
 * Boundary: internal; names and public facts only. The signing key's value never appears here (ADR 0173); a public
 *           key is not a secret. An inbox origin is `https`, or `http` to a loopback host for a dev run.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11 to 15, amendment of 2026-11-02), ADR 0296 (decision 1), ADR 0173.
 */
import { z } from "zod";

const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+\.localhost)$/;

/** An inbox origin: `https`, or `http` to a loopback host; no path, query or fragment. */
const INBOX_ORIGIN_SCHEMA = z.url().refine((value) => {
  const url = new URL(value);
  const secure =
    url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK.test(url.hostname));
  return (
    secure && (url.pathname === "/" || url.pathname === "") && url.search === "" && url.hash === ""
  );
}, "Expected an https origin (http only to a loopback host), with no path");

/** A versioned integration event wire name, `<module>.<name>.v<n>`. */
const EVENT_NAME_SCHEMA = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+\.v\d+$/,
    "Expected an event wire name such as payments.payment.captured.v1",
  );

/** One environment's cross-app relay. */
export const SERVICE_EVENTS_SCHEMA = z.strictObject({
  signingKey: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Expected a SCREAMING_SNAKE secret name")
    .default("STACKRA_EVENTS_SIGNING_KEY"),
  keys: z
    .array(
      z.strictObject({
        id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Expected a kebab-case key id"),
        publicKey: z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/, "Expected a base64url public key"),
      }),
    )
    .min(1)
    .max(2)
    .refine(
      (keys) => new Set(keys.map((key) => key.id)).size === keys.length,
      "A key id is listed more than once",
    ),
  subscribers: z
    .array(
      z.strictObject({
        member: z.string().regex(/^[a-z][a-z0-9_-]*$/, "Expected a member key"),
        inbox: INBOX_ORIGIN_SCHEMA,
        events: z.array(EVENT_NAME_SCHEMA).min(1),
      }),
    )
    .refine(
      (subscribers) =>
        new Set(subscribers.map((subscriber) => subscriber.member)).size === subscribers.length,
      "A subscriber is listed more than once",
    ),
});
