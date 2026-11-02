/**
 * Stackra file contract:
 * Purpose: `CROSS_APP_CONFIG_SCHEMA`, the shipped zod schema of `CrossAppConfig` (`CrossAppConfig$`): the environment
 *          name, the id of the current signing key, the signing key itself (a secret) and the subscribers.
 * Boundary: internal; mirrors `CrossAppOptions` by hand until gen compiles this package's schemas, so both change
 *           together. An inbox origin is `https`, or `http` to a loopback host, as runway's `events` block allows.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 12, 16 and 17, amendment of 2026-11-02); ADR 0146 as amended; ADR 0173.
 */
import { z } from "zod";

/** The loopback hosts a dev inbox may use over `http`. */
const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+\.localhost)$/;

/** One subscriber. */
const SUBSCRIBER = z.object({
  member: z.string().min(1),
  inbox: z.url().refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK.test(url.hostname));
  }, "Expected an https origin, or http to a loopback host"),
  events: z.array(z.string().min(1)).min(1),
});

/** The shipped `CrossAppConfig$`. */
export const CROSS_APP_CONFIG_SCHEMA = z.object({
  environment: z.string().min(1).default("dev"),
  keyId: z.string().default(""),
  signingKey: z.string().default(""),
  subscribers: z.array(SUBSCRIBER).default([]),
});
