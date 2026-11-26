/**
 * Stackra file contract:
 * Purpose: the deploy-time configuration of @stackra/{{NAME}}, its fields from `{{PASCAL}}Options`. A field's type is
 *          its rule and its initializer the default; a host overrides it with a `<Host>{{PASCAL}}Config` subclass that declares `override` members only.
 * Boundary: values only; never varies per tenant (that is a setting) and never holds a secret value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 19); ADR 0146 (configuration layers).
 */
import { Config } from "@stackra/config";

import { {{PASCAL}}Options } from "#core/schemas/{{NAME}}-options.schema";

/** The configuration of @stackra/{{NAME}}; its key is the package key, because the file is named after the package. */
export class {{PASCAL}}Config extends Config({ schema: {{PASCAL}}Options }) {}
