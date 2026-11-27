/**
 * Stackra file contract:
 * Purpose: every public hostname of the shared static-files Worker, the main one first: a schema `$id` may name any
 *          of them, and each published copy keeps the host its `$id` names (ADR 0284 decision 3 as amended, STA-2892).
 * Boundary: a constant only; runway.yaml lists the same hosts, in this order, as the member's `customDomains`.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files, decisions 2 and 3 as amended), ADR 0175 (domain names).
 */
import { STATIC_HOST } from "./static-host.constant";

/**
 * The hosts a schema `$id` may name. `static.stackra.figentra.com` stays, permanently, so every existing `$schema` URL
 * keeps resolving; a new schema names `STATIC_HOST`. A `$id` on any other host is a build error, because the published
 * URL would not match the identifier editors resolve.
 */
export const STATIC_HOSTS: readonly string[] = [STATIC_HOST, "static.stackra.figentra.com"];
