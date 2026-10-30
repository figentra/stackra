/**
 * Stackra file contract:
 * Purpose: `DemoBoundary`, the error boundary around a live demo: a demo that throws shows `fallback` instead of
 *          taking the page down.
 * Boundary: React's class boundary; the one class component of the page (hooks cannot catch render errors).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5 (error boundary).
 */
import { Component, type ErrorInfo } from "react";

import type { DemoBoundaryProps } from "#src/components/component-page/demo-boundary.props";

/** Catches a demo's render error and draws the fallback. */
export class DemoBoundary extends Component<DemoBoundaryProps, { readonly hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("demo failed to render", error, info.componentStack);
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
