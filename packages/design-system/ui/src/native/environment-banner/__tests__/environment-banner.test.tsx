/**
 * Stackra file contract:
 * Purpose: proves the native EnvironmentBanner draws nothing in production, and elsewhere hands the native Alert a
 *          warning tone, the environment as its title, and its description and actions.
 * Boundary: React Native does not render in vitest, so the package's native Alert is replaced by a recording stand-in.
 * Runtime: node
 * Governing contract: ADR 0280 (decision 5 and open detail 4); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { EnvironmentBanner } from "#native/environment-banner/environment-banner";

const received = vi.hoisted(() => ({ props: undefined as Record<string, unknown> | undefined }));

vi.mock("#native/alert/alert", () => ({
  Alert: (props: Record<string, unknown>) => {
    received.props = props;
    return null;
  },
}));

describe("EnvironmentBanner (native)", () => {
  beforeEach(() => {
    received.props = undefined;
  });

  it("draws nothing in production", () => {
    render(<EnvironmentBanner environment="Production" isProduction />);
    expect(received.props).toBeUndefined();
  });

  it("hands the Alert a warning with the environment, description and actions", () => {
    const actions = <i />;
    render(
      <EnvironmentBanner
        environment="Sandbox"
        isProduction={false}
        description="Messages are captured."
        actions={actions}
      />,
    );
    expect(received.props).toMatchObject({
      tone: "warning",
      title: "Sandbox",
      description: "Messages are captured.",
      actions,
    });
  });
});
