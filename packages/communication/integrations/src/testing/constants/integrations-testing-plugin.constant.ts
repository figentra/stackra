/**
 * Stackra file contract:
 * Purpose: `INTEGRATIONS_TESTING_PLUGIN`, the testing-module plugin of @stackra/integrations: `.withIntegrationApi(
 *          Integration, fake)` puts in place an instance of the Integration whose `api` is the fake, and
 *          `.withConnection(Connection, { id, fields })` puts the connection in a local `ConnectionStore`, reached by
 *          `find` from a test `ConnectionContext`, with its Integration's fake as its client. Both chain methods are
 *          declared on `TestingModuleBuilder` here and registered when this module loads.
 * Boundary: no request leaves the process and no secret is read: a connection's client is its Integration's fake,
 *           looked up when it is called, so the calls may come in any order; a connection put in place skips its
 *           `check()`. The connection's class must be registered (`registerConnections`, which gen's module does).
 *           Imports `.` and `@stackra/container/testing` only (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the STA-348 registry row (builder extension point); ADR 0308 (rule 12).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingModuleBuilder, TestingPlugin } from "@stackra/container/testing";

import { INTEGRATION_STATE } from "#core/constants/integration-state.constant";
import { LOCAL_CONNECTIONS } from "#core/constants/local-connections.constant";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { newConnectionId } from "#core/functions/new-connection-id.function";
import { registrationOf } from "#core/functions/registration-of.function";
import { splitFields } from "#core/functions/split-fields.function";
import {
  ConnectedAccount,
  ConnectionContext,
  ConnectionLevel,
  ConnectionStore,
  IntegrationRuntime,
  LocalConnectionStoreDriver,
} from "#core/index";
import type {
  Connection,
  ConnectionClass,
  ConnectionRecord,
  Integration,
  IntegrationApi,
  IntegrationClass,
} from "#core/index";
import type { TestConnection } from "#testing/types/test-connection.type";

declare module "@stackra/container/testing" {
  interface TestingModuleBuilder {
    /** Puts an instance of `type` whose `api` is `api` in place, and makes `api` its connections' client. */
    withIntegrationApi<I extends Integration>(type: IntegrationClass<I>, api: IntegrationApi): this;

    /** Puts a connection of `type` in the connection store, owned by the test scope (or test user); calls add up. */
    withConnection<C extends Connection>(
      type: ConnectionClass<C>,
      connection: TestConnection<C>,
    ): this;
  }
}

/** The scope node a test call acts in, unless a connection names another. */
const TEST_SCOPE: ScopeRef = {
  id: "scp_00000000000000000000000000",
  path: "scp_00000000000000000000000000",
};

/** The user a test call acts for, unless a connection names another. */
const TEST_USER: PublicId<"usr"> = "usr_00000000000000000000000000";

/** The managed client methods. */
const METHODS = ["get", "delete", "post", "put", "patch"] as const;

/** What one builder has been given. */
interface IntegrationsTestingState {
  readonly apis: Map<IntegrationClass, IntegrationApi>;
  readonly records: (ConnectionRecord & { readonly type: ConnectionClass })[];
  scope: ScopeRef;
  userId: PublicId<"usr">;
}

/** The state of each builder. */
const STATES = new WeakMap<TestingModuleBuilder, IntegrationsTestingState>();

/** The state of `builder`, created on first use. */
function stateOf(builder: TestingModuleBuilder): IntegrationsTestingState {
  const known = STATES.get(builder);
  if (known !== undefined) return known;
  const state: IntegrationsTestingState = {
    apis: new Map(),
    records: [],
    scope: TEST_SCOPE,
    userId: TEST_USER,
  };
  STATES.set(builder, state);
  return state;
}

/** A client that calls `type`'s fake when it is called, so `.withIntegrationApi` may come after `.withConnection`. */
function lazyApi(state: IntegrationsTestingState, type: IntegrationClass): IntegrationApi {
  const fake = (): IntegrationApi => {
    const api = state.apis.get(type);
    if (api === undefined)
      throw new TypeError(
        `${type.name} has no fake client: call .withIntegrationApi(${type.name}, fakeIntegrationApi(...))`,
      );
    return api;
  };
  return Object.fromEntries(
    METHODS.map((method) => [
      method,
      (...args: never[]) => (fake()[method] as (...rest: never[]) => unknown)(...args),
    ]),
  ) as unknown as IntegrationApi;
}

/** Rebuilds the store, its context and its runtime from the state, and puts them in place. */
function apply(
  builder: TestingModuleBuilder,
  state: IntegrationsTestingState,
): TestingModuleBuilder {
  const instances = new Map<IntegrationClass, Integration>();
  const runtime = Object.assign(Object.create(IntegrationRuntime.prototype) as IntegrationRuntime, {
    client: (integration: Integration) =>
      lazyApi(state, integration.constructor as IntegrationClass),
    integration: (type: IntegrationClass) => {
      const built = instances.get(type) ?? (Reflect.construct(type, []) as Integration);
      INTEGRATION_STATE.set(built, { api: lazyApi(state, type) });
      instances.set(type, built);
      return built;
    },
    revoke: async () => undefined,
  });
  const context = Object.assign(Object.create(ConnectionContext.prototype) as ConnectionContext, {
    scope: () => state.scope,
    user: () => state.userId,
  });
  const store = new LocalConnectionStoreDriver(context, runtime);
  const records = LOCAL_CONNECTIONS.get(store);
  for (const record of state.records) records?.set(record.id, record);
  return builder.override(ConnectionStore, store).override(ConnectionContext, context);
}

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * await createTestingModule(NotificationsModule)
 *   .withIntegrationApi(ResendIntegration, resendFake)
 *   .withConnection(ResendConnection, { id: "conn_00000000000000000000000001", fields })
 *   .compile();
 */
export const INTEGRATIONS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/integrations",
  builder: {
    withIntegrationApi(this: TestingModuleBuilder, type: IntegrationClass, api: IntegrationApi) {
      const state = stateOf(this);
      state.apis.set(type, api);
      const instance = Reflect.construct(type, []) as Integration;
      INTEGRATION_STATE.set(instance, { api });
      this.override(type, instance);
      return apply(this, state);
    },
    withConnection(
      this: TestingModuleBuilder,
      type: ConnectionClass,
      connection: TestConnection<Connection>,
    ) {
      const state = stateOf(this);
      const level =
        connection.level ??
        integrationOptionsOf(registrationOf(type).integration).levels[0] ??
        ConnectionLevel.Scope;
      if (connection.scope !== undefined) state.scope = connection.scope;
      if (connection.userId !== undefined) state.userId = connection.userId;
      state.records.push({
        type,
        id: connection.id ?? newConnectionId(),
        level,
        ...(level === ConnectionLevel.User ? { userId: state.userId } : { scope: state.scope }),
        ...splitFields(type, connection.fields),
        account: ConnectedAccount.create({ id: "test-account" }),
      });
      return apply(this, state);
    },
  },
};

registerTestingPlugin(INTEGRATIONS_TESTING_PLUGIN);
