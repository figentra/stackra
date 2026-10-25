/**
 * Stackra file contract:
 * Purpose: `prepareConnection`, the part of a connect both store drivers share: build the connection from its draft,
 *          run its `check()`, subscribe its webhook URL when one is given and the class subscribes, and keep a secret
 *          the provider issued in the field the Integration's `webhooks.secret` placeholder names.
 * Boundary: internal; it stores nothing, so a `check()` or `subscribe()` that throws leaves no trace in the store. The
 *           issued secret is kept non-enumerable when its field is a `@Secret` field.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 14 and 17).
 */
import { Secret } from "@stackra/config";

import type { Connection } from "#core/bases/connection.base";
import type { Integration } from "#core/bases/integration.base";
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import type { ConnectionClass } from "#core/types/connection-class.type";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";
import type { IntegrationApi } from "#core/types/integration-api.type";

/** A placeholder that is the whole value: `{webhookSecret}`. */
const WHOLE_PLACEHOLDER = /^\{([A-Za-z_$][\w$]*)\}$/;

/**
 * The checked connection and the record to store.
 *
 * @throws whatever `check()` or `subscribe()` throws, before anything is stored.
 * @throws TypeError when `subscribe()` returns a secret and the Integration names no field to keep it in.
 * @example
 * const { connection, record } = await prepareConnection(ResendConnection, resend, draft, apiFor, webhookUrl);
 */
export async function prepareConnection<C extends Connection>(
  type: ConnectionClass<C>,
  integration: Integration,
  draft: Omit<ConnectionRecord, "account">,
  apiFor: (connection: C) => IntegrationApi,
  webhookUrl: string | undefined,
): Promise<{ connection: C; record: ConnectionRecord }> {
  const connection = hydrateConnection(type, draft, apiFor);
  const account = await connection.check();
  const webhooks = connection as C & ConnectionWebhooks;
  if (webhookUrl === undefined || webhooks.subscribe === undefined)
    return { connection, record: { ...draft, account } };
  const { secret } = await webhooks.subscribe(webhookUrl);
  if (secret === undefined) return { connection, record: { ...draft, account } };
  const placeholder = integrationOptionsOf(integration.constructor).webhooks?.secret ?? "";
  const field = WHOLE_PLACEHOLDER.exec(placeholder)?.[1];
  if (field === undefined)
    throw new TypeError(
      `${type.name}.subscribe() returned a webhook secret, but ${integration.constructor.name} names no webhooks.secret field to keep it in`,
    );
  const isSecret = Secret.members(type).has(field);
  Object.defineProperty(connection, field, {
    value: secret,
    enumerable: !isSecret,
    writable: !isSecret,
    configurable: true,
  });
  const record: ConnectionRecord = isSecret
    ? { ...draft, secrets: { ...draft.secrets, [field]: secret }, account }
    : { ...draft, fields: { ...draft.fields, [field]: secret }, account };
  return { connection, record };
}
