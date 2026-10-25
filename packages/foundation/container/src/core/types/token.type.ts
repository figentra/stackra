/**
 * Stackra file contract:
 * Purpose: `Token<T>`, what the container resolves: a class (classes are the only tokens) or the named token of one
 *          instance of a port.
 * Boundary: a type only; never a string (ADR 0263 decision 13).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 17); ADR 0145 as amended by 0294 (classes are the only tokens).
 */
import type { AnyClass } from "#core/types/any-class.type";
import type { NamedToken } from "#core/types/named-token.type";

/** A class, or `named(Port, "x")`. */
export type Token<T extends object = object> = AnyClass<T> | NamedToken;
