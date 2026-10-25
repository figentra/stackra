/**
 * Stackra file contract:
 * Purpose: unit tests of `registerContext`: a registered component lands in the registry under its key, registering
 *          the same component again is a no-op, and a different component for a taken key throws naming the key.
 * Boundary: test only; registers test-only keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import type { ContextProps } from "#react/contexts/context-props.type";
import { CONTEXT_REGISTRY } from "#react/contexts/context-registry.constant";
import { registerContext } from "#react/contexts/register-context";

/** A context that renders its tree as it is. */
const passThrough = ({ children }: ContextProps) => children;

/** Another context, for the clash. */
const other = ({ children }: ContextProps) => children;

describe("registerContext", () => {
  it("registers a component under its key", () => {
    registerContext("test_theming", passThrough);
    expect(CONTEXT_REGISTRY.get("test_theming")).toBe(passThrough);
  });

  it("accepts the same component again", () => {
    registerContext("test_flags", passThrough);
    expect(() => registerContext("test_flags", passThrough)).not.toThrow();
  });

  it("refuses a different component for a taken key", () => {
    registerContext("test_consent", passThrough);
    expect(() => registerContext("test_consent", other)).toThrow(/test_consent/);
    expect(CONTEXT_REGISTRY.get("test_consent")).toBe(passThrough);
  });
});
