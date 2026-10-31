/**
 * Stackra file contract:
 * Purpose: `PackSection<S>`, a `Schema` class read as one section of a market pack: its `static readonly packPrefix`
 *          names the section (`billing.dunning`), and each field reads the key `<packPrefix>.<snake_case(field)>`.
 * Boundary: a type only; `ResolvedPackSource.sectionFor` takes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; STA-1726 (the prefix sits on the class, leader decision 2026-10-31).
 */
import type { AnyClass } from "@stackra/container";
import type { Schema } from "@stackra/validation";

/** A Schema class with its section's key prefix. */
export type PackSection<S extends Schema> = AnyClass<S> &
  Pick<typeof Schema, "create"> & { readonly packPrefix: string };
