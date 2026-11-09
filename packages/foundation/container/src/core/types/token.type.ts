/**
 * Stackra file contract:
 * Purpose: `Token<T>`, what the container resolves: a class (classes are the only tokens), the named token of one
 *          instance of a port, or `Container` itself.
 * Boundary: a type only; never a string (ADR 0263 decision 13).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17); ADR 0145 as amended by 0294 (classes are the only tokens).
 */
import type { Container } from "#core/services/container.service";
import type { AnyClass } from "#core/types/any-class.type";
import type { NamedToken } from "#core/types/named-token.type";

/**
 * A class, or `named(Port, "x")`. `Container` is listed by itself: its constructor is private, so it is no `AnyClass`,
 * yet a class may inject it (the container builds it, `CONTAINER_BUILT`).
 */
export type Token<T extends object = object> = AnyClass<T> | NamedToken | typeof Container;
