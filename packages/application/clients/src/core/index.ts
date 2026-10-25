/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/clients (the ref factories gen writes `#stackra/clients/<service>`
 *          over, `ServiceClient`, the config, the HTTP `ClientTransport` and `MutationSender` drivers, the transport
 *          and server refusals, and the public types) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under the generated name
 *           `ClientsConfig$`. `ClientTransportName` and `MutationSenderName` carry the `DriverRegistry` augmentation,
 *           so exporting them loads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ClientsConfig } from "#config/clients.config";
export { ClientAction } from "#core/bases/client-action.base";
export { ClientQuery } from "#core/bases/client-query.base";
export { ClientRefusal } from "#core/bases/client-refusal.base";
export { ServiceClient } from "#core/bases/service-client.base";
export { CLIENTS_CONFIG_SCHEMA as ClientsConfig$ } from "#core/constants/clients-config-schema.constant";
export { ClientMutationSenderDriver } from "#core/drivers/client-mutation-sender.driver";
export { HttpClientTransportDriver } from "#core/drivers/http-client-transport.driver";
export { ServerRefusalError } from "#core/errors/server-refusal.error";
export { TransportError } from "#core/errors/transport.error";
export { actionRef } from "#core/functions/action-ref.function";
export { clientModule } from "#core/functions/client-module.function";
export { eventRef } from "#core/functions/event-ref.function";
export { intents } from "#core/functions/intents.function";
export { moduleRef } from "#core/functions/module-ref.function";
export { permissionRefs } from "#core/functions/permission-refs.function";
export { permissionsRef } from "#core/functions/permissions-ref.function";
export { queryRef } from "#core/functions/query-ref.function";
export { refusalRef } from "#core/functions/refusal-ref.function";
export { remoteAction } from "#core/functions/remote-action.function";
export { remoteEvent } from "#core/functions/remote-event.function";
export { remoteQuery } from "#core/functions/remote-query.function";
export { remoteRefusal } from "#core/functions/remote-refusal.function";
export { remoteShape } from "#core/functions/remote-shape.function";
export { widgetRef } from "#core/functions/widget-ref.function";
export { ClientsOptions } from "#core/schemas/clients-options.schema";
export type { ActionInput } from "#core/types/action-input.type";
export type { ActionMember } from "#core/types/action-member.type";
export type { ActionRef } from "#core/types/action-ref.type";
export type { ActionRefOptions } from "#core/types/action-ref-options.type";
export type { ActionResult } from "#core/types/action-result.type";
export type { ActionTexts } from "#core/types/action-texts.type";
export type { CallOptions } from "#core/types/call-options.type";
export type { CallRef } from "#core/types/call-ref.type";
export type { ClientActionOptions } from "#core/types/client-action-options.type";
export type { ClientError } from "#core/types/client-error.type";
export type { ClientModuleClass } from "#core/types/client-module-class.type";
export type { ClientQueryOptions } from "#core/types/client-query-options.type";
export type { ClientRefusalOptions } from "#core/types/client-refusal-options.type";
export type { ClientTransportName } from "#core/types/client-transport-name.type";
export type { EventRef } from "#core/types/event-ref.type";
export type { EventRefOptions } from "#core/types/event-ref-options.type";
export type { IntentEntry } from "#core/types/intent-entry.type";
export type { MutationSenderName } from "#core/types/mutation-sender-name.type";
export type { PermissionsRef } from "#core/types/permissions-ref.type";
export type { QueryMember } from "#core/types/query-member.type";
export type { QueryOutput } from "#core/types/query-output.type";
export type { QueryRef } from "#core/types/query-ref.type";
export type { QueryRefCache } from "#core/types/query-ref-cache.type";
export type { QueryRefOptions } from "#core/types/query-ref-options.type";
export type { RefInput } from "#core/types/ref-input.type";
export type { RefOutput } from "#core/types/ref-output.type";
export type { RefSchema } from "#core/types/ref-schema.type";
export type { RefusalRef } from "#core/types/refusal-ref.type";
export type { RefusalRefOptions } from "#core/types/refusal-ref-options.type";
export type { RemoteCallOptions } from "#core/types/remote-call-options.type";
export type { RemoteShape } from "#core/types/remote-shape.type";
export type { SchemaOf } from "#core/types/schema-of.type";
export type { ShapeInstance } from "#core/types/shape-instance.type";
export type { WidgetRef } from "#core/types/widget-ref.type";
export type { WidgetRefOptions } from "#core/types/widget-ref-options.type";
