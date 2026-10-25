/**
 * Stackra file contract:
 * Purpose: `AccessLogModule`, the root module of the access-log package: what it shares with a host. Everything else in
 *          src/node is discovered from its path and base class.
 * Boundary: the key is the package key (`access_log`), the namespace of the permission, lang keys and table of the
 *           package. No bindings list and no imports: gen discovers the sink drivers, the Explorer and the purge job,
 *           writes the sink binding into `#stackra/wiring` from config `sink` (or a host `@Replaces(AccessLogSink)`),
 *           and loads the Postgres driver lazily.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 12, 15 and 16); ADR 0305 (an optional root module, written here for its
 *                     export); ADR 0263 (gen writes the wiring).
 */
import { Module } from "@stackra/container";

import { AccessLogService } from "#core/services/access-log.service";

/** Imported once by a host; every `@AccessLogged` class is then logged. */
export class AccessLogModule extends Module({ exports: [AccessLogService] }) {}
