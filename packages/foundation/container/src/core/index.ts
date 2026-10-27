/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/container, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Nothing named `Injectable`, `Inject`, `defineToken` or
 *           `Provider` is exported (ADR 0294 decisions 6, 17 and 23).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Driver } from "#core/bases/driver.base";
export { Explorer } from "#core/bases/explorer.base";
export { Module } from "#core/bases/module.base";
export { Service } from "#core/bases/service.base";
export { Lifetime } from "#core/decorators/lifetime.decorator";
export { Replaces } from "#core/decorators/replaces.decorator";
export { DecoratorTarget } from "#core/enums/decorator-target.enum";
export { UnresolvedPortError } from "#core/errors/unresolved-port.error";
export { createDecorator } from "#core/functions/create-decorator.function";
export { createKind } from "#core/functions/create-kind.function";
export { kindOf } from "#core/functions/kind-of.function";
export { named } from "#core/functions/named.function";
export { registerKind } from "#core/functions/register-kind.function";
export { Container } from "#core/services/container.service";
export { DiscoveryService } from "#core/services/discovery.service";
export type { AnyClass } from "#core/types/any-class.type";
export type { ContainerBindingEntry } from "#core/types/container-binding-entry.type";
export type { ContainerOptions } from "#core/types/container-options.type";
export type { Decorator } from "#core/types/decorator.type";
export type { DecoratorDefinition } from "#core/types/decorator-definition.type";
export type { DecoratorFunction } from "#core/types/decorator-function.type";
export type { DiscoveredClass } from "#core/types/discovered-class.type";
export type { DriverChoice } from "#core/types/driver-choice.type";
export type { DriverClass } from "#core/types/driver-class.type";
export type { DriverName } from "#core/types/driver-name.type";
export type { DriverRegistry } from "#core/types/driver-registry.type";
export type { KindRecord } from "#core/types/kind-record.type";
export type { ModuleClass } from "#core/types/module-class.type";
export type { ModuleOptions } from "#core/types/module-options.type";
export type { Named } from "#core/types/named.type";
export type { NamedToken } from "#core/types/named-token.type";
export type { Token } from "#core/types/token.type";
export type { Wiring } from "#core/types/wiring.type";
export type { WiringBinding } from "#core/types/wiring-binding.type";
export type { WiringConfig } from "#core/types/wiring-config.type";
export type { WiringDriver } from "#core/types/wiring-driver.type";
export type { WiringModule } from "#core/types/wiring-module.type";
export type { WiringReplacement } from "#core/types/wiring-replacement.type";
export type { WithPartner } from "#core/types/with-partner.type";
