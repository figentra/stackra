/**
 * Stackra file contract:
 * Purpose: the deploy-time configuration of @stackra/icons. Its fields are `IconsOptions`; a
 *          host overrides it with a `<Host>IconsConfig` subclass that declares `override` members only.
 * Boundary: values only; never varies per tenant (that is a setting) and never holds a secret value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0146 (configuration layers).
 */
import { Config } from "@stackra/config";

import { IconsOptions } from "#core/schemas/icons-options.schema";

/** The configuration of @stackra/icons; its key is the package key, because the file is named after the package. */
export class IconsConfig extends Config({ schema: IconsOptions }) {}
