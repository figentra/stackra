/**
 * Stackra file contract:
 * Purpose: `PreviewBoundary`, the error boundary around a thumbnail's demo: a demo that throws shows the fallback (the
 *          category glyph) so one broken preview never takes a listing down.
 * Boundary: presentation only; logs the failure as a warning.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 5.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

/** Catches a demo that throws and shows the fallback instead. */
export class PreviewBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("component thumbnail failed", error, info.componentStack);
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
