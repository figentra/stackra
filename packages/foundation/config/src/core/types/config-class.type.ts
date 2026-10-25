/**
 * Stackra file contract:
 * Purpose: `ConfigClass<S, E>`, the class `Config({ schema, env })` returns: constructible with no argument, its
 *          instances are a `Config` with the schema's data fields typed on them (no `declare` lines needed).
 * Boundary: a type only, one construct signature, so `class X extends Config(...)` resolves one base type and a
 *           consumer's declaration emit can name it (ADR 0294 decision 25). Fields are readonly: a built
 *           configuration is frozen; a host override still redeclares a field with `override`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 25); the 2026-10-24 owner decision from template PR #16.
 */
import type { Fields, Schema } from "@stackra/validation";

import type { Config } from "#core/bases/config.base";
import type { EnvMap } from "#core/types/env-map.type";

/** A configuration class over schema `S` with env map `E`. */
export type ConfigClass<S extends Schema, E extends EnvMap<S>> = new () => Config<S, E> &
  Readonly<Fields<S>>;
