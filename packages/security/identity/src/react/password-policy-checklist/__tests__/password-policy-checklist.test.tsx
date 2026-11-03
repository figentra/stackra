/**
 * Stackra file contract:
 * Purpose: proves the PasswordPolicyChecklist lists only the rules the policy sets in a list named by the host, marks
 *          each met or not yet in words (not colour alone), counts the met rules on a meter, counts characters rather
 *          than UTF-16 units, carries the id a password field points at, and lays out logically in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0207 (decision 3); ADR 0060 (right-to-left).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen, within } from "@testing-library/react";

import type { PasswordPolicy } from "#contracts/index";
import { PasswordPolicyChecklist } from "#react/password-policy-checklist/password-policy-checklist";

const LABELS = {
  label: "Password rules",
  minLength: "At least 12 characters",
  uppercase: "A capital letter",
  lowercase: "A small letter",
  number: "A number",
  symbol: "A symbol",
  met: "Met",
  unmet: "Not yet",
};

const LENGTH_ONLY: PasswordPolicy = {
  minLength: 12,
  hasUppercase: false,
  hasLowercase: false,
  hasNumber: false,
  hasSymbol: false,
};

const EVERY_RULE: PasswordPolicy = {
  minLength: 12,
  hasUppercase: true,
  hasLowercase: true,
  hasNumber: true,
  hasSymbol: true,
};

/** The row of the rule worded `word`. */
const row = (word: string) => screen.getByText(word).closest("li") as HTMLElement;

describe("PasswordPolicyChecklist", () => {
  afterEach(cleanup);

  it("lists only the policy's rules in a named list", () => {
    render(<PasswordPolicyChecklist policy={LENGTH_ONLY} password="" labels={LABELS} />);
    const list = screen.getByRole("list", { name: "Password rules" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("A capital letter")).toBeNull();
  });

  it("marks each rule met or not yet in words", () => {
    render(<PasswordPolicyChecklist policy={EVERY_RULE} password="Abc1" labels={LABELS} />);
    expect(within(row("A capital letter")).getByRole("img", { name: "Met" })).toBeTruthy();
    expect(within(row("A number")).getByRole("img", { name: "Met" })).toBeTruthy();
    expect(within(row("A symbol")).getByRole("img", { name: "Not yet" })).toBeTruthy();
    expect(
      within(row("At least 12 characters")).getByRole("img", { name: "Not yet" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("meter", { name: "Password rules" }).getAttribute("aria-valuenow"),
    ).toBe("3");
  });

  it("counts characters, not UTF-16 units", () => {
    render(
      <PasswordPolicyChecklist policy={LENGTH_ONLY} password={"😀".repeat(6)} labels={LABELS} />,
    );
    expect(
      within(row("At least 12 characters")).getByRole("img", { name: "Not yet" }),
    ).toBeTruthy();
  });

  it("carries the id a password field points at", () => {
    const { container } = render(
      <PasswordPolicyChecklist id="rules" policy={LENGTH_ONLY} password="" labels={LABELS} />,
    );
    expect(container.querySelector("#rules")?.textContent).toContain("At least 12 characters");
  });

  it("lays out logically in Arabic", () => {
    render(
      <div dir="rtl">
        <PasswordPolicyChecklist
          policy={LENGTH_ONLY}
          password="كلمة مرور طويلة جدا"
          labels={{ ...LABELS, minLength: "١٢ حرفًا على الأقل", met: "مستوفى" }}
        />
      </div>,
    );
    const item = row("١٢ حرفًا على الأقل");
    expect(within(item).getByRole("img", { name: "مستوفى" })).toBeTruthy();
    expect(item.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-)/);
  });
});
