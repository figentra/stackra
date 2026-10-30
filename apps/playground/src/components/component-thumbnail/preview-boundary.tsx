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
  /** True once the preview has thrown. */
  override state = { hasError: false };

  /** Marks the boundary failed so the next render draws the fallback. */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /** Logs the error and the component stack. */
  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("component thumbnail failed", error, info.componentStack);
  }

  /** Draws the fallback after an error, else the preview. */
  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
