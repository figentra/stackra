/**
 * Stackra file contract:
 * Purpose: `BffConfig`, the configuration of the BFF's sign-in handler (key `bff`): the confidential client's secret,
 *          the cookie key and name, the callback URL, the return origins, the post-logout URL and the lifetimes.
 * Boundary: a configuration class over `BffOptions` with no env map; runway's `config.bff` layer sets the values per
 *           environment, and the `IDENTITY_BFF_CLIENT_SECRET` and `IDENTITY_BFF_COOKIE_KEY` secrets come from the
 *           secret store. Read by `BffService` only; server only, exported from `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0173 and ADR 0257; STA-1566.
 */
import { Config } from "@stackra/config";

import { BffOptions } from "#core/schemas/bff-options.schema";

/**
 * The BFF configuration.
 *
 * @example
 * import { BffConfig as BaseBffConfig } from "@stackra/identity/node";
 *
 * export class BffConfig extends BaseBffConfig {
 *   override redirectUri = "https://api.acme.example/api/auth/callback";
 *   override returnOrigins = ["https://console.acme.example"];
 * }
 */
export class BffConfig extends Config({ schema: BffOptions }) {}
