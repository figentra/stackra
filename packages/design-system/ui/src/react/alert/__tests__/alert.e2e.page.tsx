/**
 * Stackra file contract:
 * Purpose: the e2e page of `Alert`, served by the package e2e harness at `/alert`: one alert per tone the spec checks
 *          in a real browser, in English and, under the `chromium-ar` project, right to left.
 * Boundary: test only; the harness renders the default export into `#root`. No provider and no network: `Alert` needs
 *           neither.
 * Runtime: browser (Playwright, through the gen-written Vite harness)
 * Governing contract: ADR 0022 (amendment of 2026-11-09: package e2e); ADR 0302.
 */
import { Alert } from "#react/alert/alert";

/** The alerts under test. */
export default function AlertPage() {
  return (
    <main>
      <Alert title="Saved" tone="success" />
      <Alert title="Payment failed" tone="danger" />
    </main>
  );
}
