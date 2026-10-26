/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/clients` (the ref
 *          factories of the three generated-client dialects, `ServiceClient`, `DynamicClient`, `producerBaseUrl`,
 *          `TransportError`) and the registry
 *          row's config and drivers are exported, nothing else is, the `$` name is the shipped schema, and the public
 *          types the template names resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import { CLIENTS_CONFIG_SCHEMA } from "#core/constants/clients-config-schema.constant";
import * as clients from "#core/index";
import type {
  ActionInput,
  ActionRef,
  ClientError,
  ClientTransportName,
  MutationSenderName,
  QueryOutput,
  QueryRef,
} from "#core/index";

describe("@stackra/clients", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(clients).sort()).toEqual([
      "ClientAcknowledgementReaderDriver",
      "ClientAction",
      "ClientMutationSenderDriver",
      "ClientQuery",
      "ClientRefusal",
      "ClientReplicaSourceDriver",
      "ClientsConfig",
      "ClientsConfig$",
      "ClientsOptions",
      "DynamicClient",
      "HttpClientTransportDriver",
      "ServerRefusalError",
      "ServiceClient",
      "TransportError",
      "actionRef",
      "clientModule",
      "eventRef",
      "intents",
      "moduleRef",
      "permissionRefs",
      "permissionsRef",
      "producerBaseUrl",
      "queryRef",
      "refusalRef",
      "remoteAction",
      "remoteEvent",
      "remoteQuery",
      "remoteRefusal",
      "remoteShape",
      "widgetRef",
    ]);
  });

  it("exports the shipped schema under its generated name", () => {
    expect(clients.ClientsConfig$).toBe(CLIENTS_CONFIG_SCHEMA);
  });

  it("resolves its public types", () => {
    expectTypeOf<ClientTransportName>().toEqualTypeOf<"http">();
    expectTypeOf<MutationSenderName>().toEqualTypeOf<"client">();
    expectTypeOf<ClientError["refusalKey"]>().toEqualTypeOf<I18nKey | undefined>();
    expectTypeOf<QueryOutput<QueryRef<z.ZodString, z.ZodNumber>>>().toEqualTypeOf<number>();
    expectTypeOf<ActionInput<ActionRef<z.ZodString>>>().toEqualTypeOf<string>();
  });
});
