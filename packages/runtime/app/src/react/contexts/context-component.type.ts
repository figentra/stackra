/**
 * Stackra file contract:
 * Purpose: `ContextComponent`, the React component a package registers for its context key with `registerContext`
 *          (`theming` → its theme provider), which `Contexts` mounts in graph order.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 10).
 */
import type { ComponentType } from "react";

import type { ContextProps } from "#react/contexts/context-props.type";

/** A context component. */
export type ContextComponent = ComponentType<ContextProps>;
