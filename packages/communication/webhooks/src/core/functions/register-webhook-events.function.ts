/**
 * Stackra file contract:
 * Purpose: `registerWebhookEvents`, how gen's entry tells the receiver which `WebhookEvent<I>` class handles which
 *          provider event type of which Integration, and which connection class holds a connection URL's secret.
 * Boundary: writes `WEBHOOK_EVENTS` after checking each row, so a wrong row fails at boot rather than on the first
 *           delivery: a webhook event class, an Integration that declares `webhooks` with a `SignatureScheme` code
 *           (the check `@stackra/integrations` leaves to this package, which owns the codes) and, for `hmac`, its
 *           `signature` recipe, for a regional gateway scheme the `recipe` fields it reads (`RECIPE_FIELDS`), a
 *           connection class, and one class per provider event type. Registering a row again changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 15 and 16); ADR 0294 (decisions 20 and 25); ADR 0224 (decision 2);
 *                     STA-1357.
 */
import { kindOf } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { WebhookEventClass } from "@stackra/events";
import type { IntegrationWebhooks, WebhookSchemeRecipe } from "@stackra/integrations";

import { WEBHOOK_EVENTS } from "#core/constants/webhook-events.constant";
import { SignatureScheme } from "#core/enums/signature-scheme.enum";
import type { WebhookEventRegistration } from "#core/types/webhook-event-registration.type";

/** Where a scheme reads its token, signature or JWT: one of these recipe fields is set. */
type Locator = readonly (keyof WebhookSchemeRecipe)[];

/** The `recipe` fields each regional gateway scheme needs; a nested list means one of them. */
const RECIPE_FIELDS: Readonly<
  Partial<Record<SignatureScheme, readonly (keyof WebhookSchemeRecipe | Locator)[]>>
> = {
  [SignatureScheme.BodyToken]: [["path", "header", "query"]],
  [SignatureScheme.AesGcmBody]: ["ivHeader", "tagHeader"],
  [SignatureScheme.OrderedFieldHmac]: ["fields", "algorithm", ["query", "header", "path"]],
  [SignatureScheme.KeyedFieldDigest]: ["fields", "algorithm", ["path", "query", "header"]],
  [SignatureScheme.SharedHeader]: ["header"],
  [SignatureScheme.JwtHs256]: [["query", "header"]],
};

/** The first `recipe` field `scheme` needs and `recipe` lacks, written for the error. */
function missingField(
  scheme: SignatureScheme,
  recipe: WebhookSchemeRecipe | undefined,
): string | undefined {
  for (const need of RECIPE_FIELDS[scheme] ?? []) {
    const names: Locator = typeof need === "string" ? [need] : need;
    if (!names.some((name) => recipe?.[name] !== undefined)) return names.join(" or ");
  }
  return undefined;
}

/**
 * Records each webhook event under its Integration and provider event type.
 *
 * @throws TypeError when a class is not a webhook event, an Integration or a connection, the Integration declares no
 *         `webhooks`, its scheme's `signature` or `recipe` fields are missing, its connection class differs from an earlier row's, or two classes share a provider event type.
 * @throws RangeError when the Integration's `webhooks.scheme` is not a `SignatureScheme` code.
 * @example
 * registerWebhookEvents([
 *   { event: InboundMailReceived, integration: ResendIntegration, connection: ResendConnection },
 * ]);
 */
export function registerWebhookEvents(rows: readonly WebhookEventRegistration[]): void {
  for (const row of rows) {
    const { event, integration, connection } = row;
    const eventKind = kindOf(event);
    if (eventKind?.kind !== "webhook_event")
      throw new TypeError(`${event.name} does not extend WebhookEvent<Integration>({ type })`);
    const integrationKind = kindOf(integration);
    if (integrationKind?.kind !== "integration")
      throw new TypeError(`${integration.name} does not extend Integration({ ... })`);
    const webhooks = integrationKind.options["webhooks"] as IntegrationWebhooks | undefined;
    if (webhooks === undefined)
      throw new TypeError(
        `${integration.name} declares no webhooks option, so ${event.name} cannot be verified`,
      );
    if (!Enum.values(SignatureScheme).includes(webhooks.scheme as SignatureScheme))
      throw new RangeError(
        `${integration.name}: webhooks.scheme takes a SignatureScheme code, got ${JSON.stringify(webhooks.scheme)}`,
      );
    if (webhooks.scheme === SignatureScheme.Hmac && webhooks.signature === undefined)
      throw new TypeError(
        `${integration.name}: the hmac scheme reads its recipe from webhooks.signature, which is missing`,
      );
    const missing = missingField(webhooks.scheme as SignatureScheme, webhooks.recipe);
    if (missing !== undefined)
      throw new TypeError(
        `${integration.name}: the ${webhooks.scheme} scheme reads webhooks.recipe.${missing}, which is missing`,
      );
    if (connection !== undefined && kindOf(connection)?.kind !== "connection")
      throw new TypeError(`${connection.name} does not extend Connection<Integration>`);
    const known = WEBHOOK_EVENTS.byIntegration.get(integration);
    if (
      connection !== undefined &&
      known?.connection !== undefined &&
      known.connection !== connection
    )
      throw new TypeError(
        `${integration.name} is connected by ${known.connection.name} and ${connection.name}; keep one connection class per integration`,
      );
    const type = eventKind.options["type"] as string;
    const types = known?.types ?? new Map<string, WebhookEventClass<object>>();
    const holder = types.get(type);
    if (holder !== undefined && holder !== event)
      throw new TypeError(
        `${event.name} and ${holder.name} both handle ${integration.name}'s "${type}" webhook`,
      );
    types.set(type, event);
    const held = connection ?? known?.connection;
    WEBHOOK_EVENTS.byIntegration.set(integration, {
      webhooks,
      types,
      ...(held === undefined ? {} : { connection: held }),
    });
    WEBHOOK_EVENTS.byEvent.set(event, Object.freeze({ ...row }));
  }
}
